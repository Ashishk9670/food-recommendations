import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const TEST_IMAGE = path.join(__dirname, "../tests/fixtures/test-dish.png");

const PAGES = ["/", "/submit", "/this-page-does-not-exist"];

function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "page should not scroll sideways").toBeLessThanOrEqual(1);
}

async function expectImagesLoaded(page: Page) {
  // Lazy images below the fold won't have loaded; scroll so they do.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  // currentSrc is the srcset candidate the browser actually fetched.
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          [...document.images]
            .filter((img) => img.loading !== "lazy" || img.getBoundingClientRect().top < window.innerHeight * 4)
            .filter((img) => !img.currentSrc.startsWith("data:") && (!img.complete || img.naturalWidth === 0))
            .map((img) => `${img.complete ? "BROKEN" : "pending"} ${img.currentSrc}`),
        ),
      { timeout: 30_000 },
    )
    .toEqual([]);
}

async function makeJpeg(page: Page, name: string, color: string) {
  const base64 = await page.evaluate((fill) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 1200;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 1600, 1200);
    gradient.addColorStop(0, fill);
    gradient.addColorStop(1, "#fdfbf7");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1600, 1200);
    return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
  }, color);
  return { name, mimeType: "image/jpeg", buffer: Buffer.from(base64, "base64") };
}

async function cardCount(page: Page) {
  return page.getByTestId("recommendation-card").count();
}

test.describe("read-only checks", () => {
  test("browse page renders real data with no console errors @mobile", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Browse Recommendations" })).toBeVisible();
    await expect(page.getByTestId("stat-total")).toContainText(/\d+ dish/);
    await expect(page.getByTestId("stat-top-cuisine")).not.toBeEmpty();
    expect(await cardCount(page)).toBeGreaterThan(0);
    await expectImagesLoaded(page);
    await expectNoHorizontalScroll(page);
    expect(errors).toEqual([]);
  });

  test("every page has no sideways scroll in light and dark mode @mobile", async ({ page }) => {
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      for (const url of PAGES) {
        await page.goto(url);
        await expectNoHorizontalScroll(page);
      }
      await page.goto("/");
      const first = page.getByTestId("recommendation-card").first().getByRole("link").first();
      await first.click();
      await page.waitForURL(/\/recommendation\/\d+/);
      await expectNoHorizontalScroll(page);
    }
  });

  test("each category filter only shows that category", async ({ page }) => {
    for (const category of ["Biryani", "Chicken", "Paneer", "Chinese", "South Indian", "Rolls & Bowls", "Other"]) {
      await page.goto(`/?category=${encodeURIComponent(category)}`);
      const cards = page.getByTestId("recommendation-card");
      const n = await cards.count();
      for (let i = 0; i < n; i++) {
        await expect(cards.nth(i)).toContainText(category);
      }
      if (n === 0) {
        await expect(page.getByText("No recommendations match these filters yet.")).toBeVisible();
      }
    }
  });

  test("rating and budget filters respect their bounds", async ({ page }) => {
    for (const minStars of [4, 3, 2, 1]) {
      await page.goto(`/?minStars=${minStars}`);
      const chips = await page
        .getByTestId("recommendation-card")
        .locator("span", { hasText: /^\d\.\d$/ })
        .allTextContents();
      for (const chip of chips) expect(Number(chip)).toBeGreaterThanOrEqual(minStars);
    }
    for (const maxPrice of [200, 500, 1000]) {
      await page.goto(`/?maxPrice=${maxPrice}`);
      const prices = await page
        .getByTestId("recommendation-card")
        .locator("span", { hasText: /^₹[\d.]+$/ })
        .allTextContents();
      for (const price of prices) expect(Number(price.slice(1))).toBeLessThanOrEqual(maxPrice);
    }
  });

  test("sort links switch the sort; trending shows this week's or says none yet", async ({ page }) => {
    await page.goto("/");
    for (const [label, param] of [
      ["Most liked", "sort=liked"],
      ["Highest rated", "sort=rating"],
    ] as const) {
      await page.getByRole("link", { name: label, exact: true }).click();
      await page.waitForURL(new RegExp(param));
      await expect(page.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "true");
      await expect.poll(() => cardCount(page)).toBeGreaterThan(0);
    }
    // Trending only covers dishes posted this ISO week, so it can be empty.
    await page.getByRole("link", { name: "Trending", exact: true }).click();
    await page.waitForURL(/sort=trending/);
    await expect(
      page.getByTestId("recommendation-card").first().or(page.getByTestId("empty-state")).or(page.getByText("No recommendations match these filters yet.")),
    ).toBeVisible();
    await page.goto("/?sort=rating");
    const ratings = (
      await page.getByTestId("recommendation-card").locator("span", { hasText: /^\d\.\d$/ }).allTextContents()
    ).map(Number);
    expect([...ratings].sort((a, b) => b - a)).toEqual(ratings);
  });

  test("search finds a dish by name and shows the empty state for nonsense", async ({ page }) => {
    await page.goto("/");
    const firstTitle = (await page.getByTestId("recommendation-card").first().locator("h3").textContent())!.trim();
    const searchBox = page.getByRole("searchbox").or(page.getByPlaceholder("Search by dish or restaurant..."));
    await searchBox.first().fill(firstTitle);
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.waitForURL(/q=/);
    await expect(page.getByTestId("recommendation-card").filter({ hasText: firstTitle }).first()).toBeVisible();

    await page.goto("/?q=qqxxzzvvnonsense");
    await expect(page.getByText("No recommendations match these filters yet.")).toBeVisible();
  });

  test("dish detail page shows the gallery, details and comments", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    const title = (await page.getByTestId("recommendation-card").first().locator("h3").textContent())!.trim();
    await page.getByTestId("recommendation-card").first().getByRole("link").first().click();
    await page.waitForURL(/\/recommendation\/\d+/);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByText(/Comments \(\d+\)/)).toBeVisible();
    await expectImagesLoaded(page);
    expect(errors).toEqual([]);
  });

  test("submit page: photo buttons become usable and validation runs @mobile", async ({ page }) => {
    await page.goto("/submit");
    await expect(page.getByRole("button", { name: "Upload Photos" })).toBeEnabled({ timeout: 20_000 });
    await page.getByRole("button", { name: "Submit Recommendation" }).click();
    await expect(page.locator('p[role="alert"]')).toHaveText("Please enter a dish name.");
    await page.getByLabel("Dish name").fill("Paneer Butter Masala");
    await expect(page.getByTestId("detected-category")).toContainText("Paneer");
    await expect(page.getByTestId("recommendation-preview")).toContainText("Paneer Butter Masala");
  });

  test("curated spots, a spot page, leaderboard, guidelines and My recommendations load @mobile", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/restaurants");
    await expect(page.getByRole("heading", { level: 1, name: "Curated Spots" })).toBeVisible();
    const firstSpot = page.getByTestId("restaurant-card").first();
    const spotName = (await firstSpot.locator("h2").textContent())!.trim();
    await firstSpot.click();
    await page.waitForURL(/\/restaurants\/[a-z-]+$/);
    await expect(page.getByRole("heading", { level: 1, name: spotName })).toBeVisible();
    expect(await cardCount(page)).toBeGreaterThan(0);
    await expectNoHorizontalScroll(page);

    await page.goto("/leaderboard");
    await expect(page.getByRole("heading", { level: 1, name: "Leaderboard" })).toBeVisible();
    await expectNoHorizontalScroll(page);
    await page.goto("/guidelines");
    await expect(page.getByRole("heading", { level: 1, name: "Tasting Guidelines" })).toBeVisible();
    await page.goto("/me");
    await expect(page.getByText("Nothing posted from this browser yet.")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("header links reach every section", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const [label, url] of [
      ["Curated Spots", /\/restaurants$/],
      ["Top Rated Dishes", /sort=rating/],
      ["Team Favorites", /sort=liked/],
      ["Leaderboard", /\/leaderboard$/],
      ["Discover", /\/$/],
    ] as const) {
      await nav.getByRole("link", { name: label }).click();
      await page.waitForURL(url);
      await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    }
  });

  test("admin pages and APIs refuse anonymous visitors", async ({ page, request }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/admin\/login/);
    await page.goto("/admin/reports");
    await page.waitForURL(/\/admin\/login/);
    expect((await request.get("/api/admin/export")).status()).toBe(401);
    expect(
      (await request.post("/api/admin/recommendations/1/dismiss-reports")).status(),
    ).toBeGreaterThanOrEqual(400);
  });

  test("public APIs validate their input", async ({ request }) => {
    expect((await request.get("/api/recommendations/new")).status()).toBe(400);
    expect((await request.get("/api/recommendations/new?since=garbage")).status()).toBe(400);
    const recent = await request.get(`/api/recommendations/new?since=${new Date(0).toISOString()}`);
    expect(recent.ok()).toBe(true);
    expect(Array.isArray((await recent.json()).items ?? (await recent.json()))).toBe(true);
    expect((await request.delete("/api/recommendations/1")).status()).toBeGreaterThanOrEqual(400);
    expect(
      (await request.post("/api/recommendations", { data: { dishName: "" } })).status(),
    ).toBeGreaterThanOrEqual(400);
  });

  test("SEO endpoints and the 404 page", async ({ page, request }) => {
    expect((await request.get("/sitemap.xml")).ok()).toBe(true);
    expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /admin");
    const og = await request.get("/opengraph-image");
    expect(og.headers()["content-type"]).toContain("image/png");
    expect((await request.get("/this-page-does-not-exist")).status()).toBe(404);
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    // A missing dish streams behind its loading skeleton, so the status is
    // already 200 when notFound() fires; Next marks it noindex instead.
    await page.goto("/recommendation/999999999");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  });
});

test.describe("write flow (creates one test dish, then deletes it)", () => {
  test("submit, browse, comment, like, report, duplicate, edit, permissions, delete", async ({
    page,
    browser,
  }) => {
    test.setTimeout(180_000);
    page.on("dialog", (dialog) => dialog.accept());
    const failedImages: string[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/_next/image") && res.status() >= 400) {
        failedImages.push(`${res.status()} ${res.url()}`);
      }
    });
    const suffix = Array.from({ length: 6 }, () => "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]).join("");
    const dishName = `Zzztest Prod Check ${suffix}`;
    const restaurantName = `Zzztest Kitchen ${suffix}`;
    let id = 0;

    try {
      await test.step("submit", async () => {
        await page.goto("/submit");
        await expect(page.getByRole("button", { name: "Upload Photos" })).toBeEnabled({ timeout: 20_000 });
        await page.getByLabel("Dish name").fill(dishName);
        await page.getByLabel("Restaurant / place").fill(restaurantName);
        await page.getByRole("button", { name: "Rate 4 stars" }).click();
        await page.getByLabel("Price after discount (₹)").fill("123");
        await page.getByLabel("Notes").fill("Automated production check, deleted right after.");
        // Real-sized photos (like a phone's), not the 1x1 fixtures — the image
        // optimizer is part of what's being checked.
        await page.getByLabel("Upload photos").setInputFiles([
          await makeJpeg(page, "dish-1.jpg", "#c2410c"),
          await makeJpeg(page, "dish-2.jpg", "#0d9488"),
        ]);
        await page.getByRole("button", { name: "Submit Recommendation" }).click();
        await page.waitForURL((url) => url.pathname === "/", { timeout: 30_000 });
        id = await page.evaluate(() => {
          const tokens = JSON.parse(localStorage.getItem("myRecommendationTokens") ?? "{}");
          return Math.max(...Object.keys(tokens).map(Number));
        });
        expect(Number.isInteger(id) && id > 0).toBe(true);
      });

      const card = () => page.getByTestId("recommendation-card").filter({ hasText: dishName });

      await test.step("shows on browse with its details and owner controls", async () => {
        await page.goto(`/?q=${encodeURIComponent(dishName)}`);
        await expect(card().getByRole("heading", { name: dishName })).toBeVisible();
        await expect(card()).toContainText(restaurantName);
        await expect(card()).toContainText("₹123");
        await expect(card().getByRole("link", { name: "Edit" })).toBeVisible();
        await expectImagesLoaded(page);
      });

      await test.step("detail page: 2 photos and a comment", async () => {
        await page.goto(`/recommendation/${id}`);
        await expect(page.getByRole("button", { name: /photo \d/ })).toHaveCount(2);
        await page.getByLabel("Comment").fill("Prod check comment.");
        await page.getByRole("button", { name: "Post Comment" }).click();
        await expect(page.getByText("Prod check comment.")).toBeVisible();
        await expect(page.getByText("Comments (1)")).toBeVisible();
      });

      await test.step("like persists across reload", async () => {
        await page.goto(`/?q=${encodeURIComponent(dishName)}`);
        const like = card().getByRole("button", { name: /^Like/ });
        await like.click();
        await expect(like).toHaveText("1");
        await page.reload();
        await expect(card().getByRole("button", { name: /^Like/ })).toHaveAttribute("aria-pressed", "true");
      });

      await test.step("report persists across reload", async () => {
        await card().getByRole("button", { name: "Report" }).click();
        await expect(card().getByRole("button", { name: "Reported" })).toBeDisabled();
        await page.reload();
        await expect(card().getByRole("button", { name: "Reported" })).toBeDisabled();
      });

      await test.step("duplicate is rejected", async () => {
        await page.goto("/submit");
        await expect(page.getByRole("button", { name: "Upload Photos" })).toBeEnabled({ timeout: 20_000 });
        await page.getByLabel("Dish name").fill(dishName);
        await page.getByLabel("Restaurant / place").fill(restaurantName);
        await page.getByRole("button", { name: "Rate 3 stars" }).click();
        await page.getByLabel("Price after discount (₹)").fill("150");
        await page.getByLabel("Upload photos").setInputFiles(TEST_IMAGE);
        await page.getByRole("button", { name: "Submit Recommendation" }).click();
        await expect(page.locator('p[role="alert"]')).toContainText("already been recommended");
      });

      await test.step("owner edits the price", async () => {
        await page.goto(`/edit/${id}`);
        await page.getByLabel("Price after discount (₹)").fill("130");
        await page.getByRole("button", { name: "Save Changes" }).click();
        await page.waitForURL((url) => url.pathname === "/");
        await page.goto(`/?q=${encodeURIComponent(dishName)}`);
        await expect(card()).toContainText("₹130");
      });

      await test.step("another browser can't edit or delete it", async () => {
        const other = await browser.newContext();
        const otherPage = await other.newPage();
        await otherPage.goto(`/edit/${id}`);
        await expect(otherPage.getByText("You don't have permission to edit this post.")).toBeVisible();
        expect((await otherPage.request.delete(`/api/recommendations/${id}`)).status()).toBeGreaterThanOrEqual(400);
        await other.close();
      });

      await test.step("owner deletes it", async () => {
        await page.goto(`/?q=${encodeURIComponent(dishName)}`);
        await card().getByRole("button", { name: "Delete" }).click();
        await expect(card()).toHaveCount(0);
        expect((await page.request.get(`/recommendation/${id}`)).status()).toBe(404);
        id = 0;
      });
    } finally {
      if (failedImages.length) console.log("Image optimizer errors:\n" + failedImages.join("\n"));
      // If any step failed, still remove the test dish using the owner token.
      if (id) {
        const token = await page.evaluate(
          (dishId) => JSON.parse(localStorage.getItem("myRecommendationTokens") ?? "{}")[dishId],
          id,
        );
        if (token) {
          await page.request.delete(`/api/recommendations/${id}`, { headers: { "x-edit-token": token } });
        }
      }
    }
  });
});
