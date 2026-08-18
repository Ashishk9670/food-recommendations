import path from "node:path";
import { expect, test } from "@playwright/test";
import { closeDb, deleteRecommendationsByPrefix } from "./helpers/db";
import { TEST_PREFIX, uniqueDishName, uniqueRestaurantName } from "./helpers/names";

const TEST_IMAGE = path.join(__dirname, "fixtures/test-dish.png");
const TEST_IMAGE_2 = path.join(__dirname, "fixtures/test-dish-2.png");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

// Belt-and-suspenders cleanup: the test itself deletes its row via the admin
// UI as its last step, but if an earlier step fails, that step never runs —
// this guarantees no orphaned row survives to pollute the next run regardless
// of where the test failed.
test.afterAll(async () => {
  await deleteRecommendationsByPrefix(TEST_PREFIX);
  await closeDb();
});

// This is the only spec that hits the real POST /api/recommendations and
// /api/admin/login endpoints, kept to 2 and 1 calls respectively so the whole
// rate-limited suite stays comfortably under the real limits (5/10min, 5/15min)
// even across two back-to-back runs.
test("full recommendation lifecycle: submit, like, report, duplicate, edit, permissions, admin delete", async ({
  page,
  browser,
}) => {
  // This single test bundles ~12 sequential steps across the whole app, each a
  // real network round-trip to Postgres/Storage/Redis — on CI (higher latency
  // to the ap-south-1-hosted test services than local dev) the cumulative time
  // needs real headroom beyond the suite-wide per-test default.
  test.setTimeout(process.env.CI ? 120_000 : 45_000);

  page.on("dialog", (dialog) => dialog.accept());

  const dishName = uniqueDishName();
  const restaurantName = uniqueRestaurantName();

  await test.step("submit a new recommendation", async () => {
    await page.goto("/submit");
    await page.getByLabel("Dish name").fill(dishName);
    await page.getByLabel("Restaurant / place").fill(restaurantName);
    await page.getByRole("button", { name: "Rate 4 stars" }).click();
    await page.getByLabel("Price after discount (₹)").fill("250");
    await page.getByLabel(/^Photos/).setInputFiles([TEST_IMAGE, TEST_IMAGE_2]);
    await page.getByRole("button", { name: "Submit Recommendation" }).click();
    await page.waitForURL("/");
  });

  const id = await page.evaluate(() => {
    const tokens = JSON.parse(localStorage.getItem("myRecommendationTokens") ?? "{}");
    return Number(Object.keys(tokens)[0]);
  });
  expect(Number.isInteger(id)).toBe(true);

  const cardFor = (name: string) =>
    page.locator(".grid.gap-5 > div").filter({ hasText: name });

  await test.step("appears on the browse page with correct details", async () => {
    await page.goto(`/?q=${encodeURIComponent(dishName)}`);
    const card = cardFor(dishName);
    await expect(card.getByRole("heading", { name: dishName })).toBeVisible();
    await expect(card).toContainText(restaurantName);
    await expect(card).toContainText("₹250");
  });

  await test.step("permalink page shows the photo gallery and accepts a comment", async () => {
    await page.goto(`/recommendation/${id}`);
    await expect(page.getByRole("heading", { name: dishName })).toBeVisible();
    // 2 photos were uploaded, so the gallery should render 2 thumbnail buttons.
    await expect(page.getByRole("button", { name: /photo \d/ })).toHaveCount(2);

    await expect(page.getByText("No comments yet.")).toBeVisible();
    await page.getByLabel("Comment").fill("Absolutely worth the hype.");
    await page.getByRole("button", { name: "Post Comment" }).click();
    await expect(page.getByText("Absolutely worth the hype.")).toBeVisible();
    await expect(page.getByText("Comments (1)")).toBeVisible();
  });

  await test.step("like it — count increments and persists across reload", async () => {
    await page.goto(`/?q=${encodeURIComponent(dishName)}`);
    const likeBtn = cardFor(dishName).locator("button[aria-pressed]");
    await expect(likeBtn).toHaveText(/🤍\s*0/);
    await likeBtn.click();
    await expect(likeBtn).toHaveText(/❤️\s*1/);
    await expect(likeBtn).toBeDisabled();

    await page.reload();
    const likeBtnAfterReload = cardFor(dishName).locator("button[aria-pressed]");
    await expect(likeBtnAfterReload).toHaveText(/❤️\s*1/);
    await expect(likeBtnAfterReload).toBeDisabled();
  });

  await test.step("report it — shows Reported and persists across reload", async () => {
    const reportBtn = cardFor(dishName).getByRole("button", { name: /Report/ });
    await reportBtn.click(); // triggers window.confirm(), auto-accepted above
    await expect(cardFor(dishName).getByRole("button", { name: "Reported" })).toBeDisabled();

    await page.reload();
    await expect(cardFor(dishName).getByRole("button", { name: "Reported" })).toBeDisabled();
  });

  await test.step("duplicate submission (same dish + restaurant) is rejected", async () => {
    await page.goto("/submit");
    await page.getByLabel("Dish name").fill(dishName);
    await page.getByLabel("Restaurant / place").fill(restaurantName);
    await page.getByRole("button", { name: "Rate 3 stars" }).click();
    await page.getByLabel("Price after discount (₹)").fill("300");
    await page.getByLabel("Photo").setInputFiles(TEST_IMAGE);
    await page.getByRole("button", { name: "Submit Recommendation" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("already been recommended");
  });

  const editedDishName = uniqueDishName();

  await test.step("owner edits the recommendation", async () => {
    await page.goto(`/edit/${id}`);
    const dishInput = page.getByLabel("Dish name");
    await expect(dishInput).toHaveValue(dishName);
    await dishInput.fill(editedDishName);
    await page.getByRole("button", { name: "Save Changes" }).click();
    await page.waitForURL("/");

    await page.goto(`/?q=${encodeURIComponent(editedDishName)}`);
    await expect(page.getByRole("heading", { name: editedDishName })).toBeVisible();
  });

  await test.step("a browser without the owner token has no permission", async () => {
    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();

    await freshPage.goto(`/edit/${id}`);
    await expect(
      freshPage.getByText("You don't have permission to edit this post."),
    ).toBeVisible();

    await freshPage.goto(`/?q=${encodeURIComponent(editedDishName)}`);
    const freshCard = freshPage.locator(".grid.gap-5 > div").filter({ hasText: editedDishName });
    await expect(freshCard.getByRole("link", { name: "Edit" })).toHaveCount(0);
    await expect(freshCard.getByRole("button", { name: "Delete" })).toHaveCount(0);

    await freshContext.close();
  });

  await test.step("admin logs in and sees it with a report badge", async () => {
    await page.goto("/admin/login");
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Log In" }).click();
    await page.waitForURL("/admin");

    await expect(page.getByText(editedDishName)).toBeVisible();
    await expect(page.getByText("🚩 1 report")).toBeVisible();
  });

  await test.step("moderation queue lists it and can dismiss the report", async () => {
    await page.goto("/admin/reports");
    const queueRow = page.locator("div.rounded-xl").filter({ hasText: editedDishName });
    await expect(queueRow.getByText(/1 report/)).toBeVisible();

    await queueRow.getByRole("button", { name: "Dismiss reports" }).click();
    await expect(page.getByText(editedDishName)).toHaveCount(0);

    // Dismissing clears the report, but the post itself stays live.
    await page.goto("/admin");
    await expect(page.getByText(editedDishName)).toBeVisible();
    await expect(page.getByText(/report/)).toHaveCount(0);
  });

  await test.step("CSV export includes the recommendation", async () => {
    const res = await page.request.get("/api/admin/export");
    expect(res.ok()).toBe(true);
    expect(res.headers()["content-type"]).toContain("text/csv");
    const body = await res.text();
    expect(body).toContain("Recommendations");
    expect(body).toContain(editedDishName);
  });

  await test.step("admin deletes it", async () => {
    const adminRow = page.locator("div.rounded-xl").filter({ hasText: editedDishName });
    await adminRow.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText(editedDishName)).toHaveCount(0);

    await page.goto(`/?q=${encodeURIComponent(editedDishName)}`);
    await expect(page.getByRole("heading", { name: editedDishName })).toHaveCount(0);
  });

  await test.step("admin logout ends the session", async () => {
    await page.goto("/admin");
    await page.getByRole("button", { name: "Log out" }).click();
    await page.goto("/admin");
    await page.waitForURL("/admin/login");
  });
});
