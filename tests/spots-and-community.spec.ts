import { expect, test } from "@playwright/test";
import { deleteRecommendationsByPrefix, seedRecommendations } from "./helpers/db";

// Dish, restaurant and reviewer names share a prefix no other spec searches
// for (fuzzy search would otherwise mix them into other specs' results).
const PREFIX = "Wkrspot";
const IMAGE_URL =
  "https://lpnnisusypuadcqyuddh.supabase.co/storage/v1/object/public/recommendation-images/seed.png";

let savedDishId = 0;

test.beforeAll(async () => {
  await deleteRecommendationsByPrefix(PREFIX);
  const base = { category: "Other", likeCount: 0, imageUrl: IMAGE_URL, reviewerName: `${PREFIX} Anu` };
  const ids = await seedRecommendations([
    // Same place typed two ways: these must group as one spot.
    { ...base, dishName: `${PREFIX} Masala Dosa`, restaurantName: `${PREFIX} Kitchen`, rating: 5, price: 120, createdAt: new Date(Date.now() - 3000) },
    { ...base, dishName: `${PREFIX} Filter Coffee`, restaurantName: `${PREFIX.toLowerCase()}  kitchen`, rating: 3, price: 40, createdAt: new Date(Date.now() - 2000) },
    { ...base, dishName: `${PREFIX} Kathi Roll`, restaurantName: `${PREFIX} Annex`, rating: 4, price: 180, likeCount: 2, createdAt: new Date(Date.now() - 1000) },
  ]);
  savedDishId = ids[2];
});

test.afterAll(async () => {
  await deleteRecommendationsByPrefix(PREFIX);
});

test("curated spots groups the same place typed differently and links to its page", async ({ page }) => {
  await page.goto("/restaurants");
  const spot = page.getByTestId("restaurant-card").filter({ hasText: `${PREFIX} Kitchen` });
  await expect(spot).toHaveCount(1);
  await expect(spot).toContainText("2");
  await expect(spot).toContainText("4.0");
  await expect(spot).toContainText("₹40–120");

  await spot.click();
  await page.waitForURL(`/restaurants/${PREFIX.toLowerCase()}-kitchen`);
  await expect(page.getByRole("heading", { level: 1, name: `${PREFIX} Kitchen` })).toBeVisible();
  await expect(page.getByTestId("restaurant-dish-count")).toHaveText("2");
  // Best rated first.
  await expect(page.getByTestId("recommendation-card").first()).toContainText(`${PREFIX} Masala Dosa`);
  await expect(page.getByTestId("recommendation-card")).toHaveCount(2);

  await page.getByRole("link", { name: "Recommend a dish here" }).click();
  await page.waitForURL(/\/submit\?restaurant=/);
  await expect(page.getByLabel("Restaurant / place")).toHaveValue(`${PREFIX} Kitchen`);
});

test("a card's restaurant line links to that spot, and unknown spots 404", async ({ page }) => {
  await page.goto(`/?q=${PREFIX}`);
  await page.getByRole("link", { name: `at ${PREFIX} Annex` }).click();
  await page.waitForURL(`/restaurants/${PREFIX.toLowerCase()}-annex`);
  await expect(page.getByTestId("recommendation-card")).toHaveCount(1);

  await page.goto("/restaurants/no-such-place-anywhere");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("leaderboard ranks named reviewers with their dish and like counts", async ({ page }) => {
  await page.goto("/leaderboard");
  const row = page.getByTestId("leaderboard-row").filter({ hasText: `${PREFIX} Anu` });
  await expect(row).toBeVisible();
  await expect(row).toContainText("3");
  await expect(row).toContainText("2 spots");
});

test("saving a dish puts it on My recommendations, alongside posts from this browser", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(
    (id) => localStorage.setItem("myRecommendationTokens", JSON.stringify({ [id]: "not-a-real-token" })),
    savedDishId,
  );

  await page.goto(`/?q=${PREFIX}`);
  const card = page.getByTestId("recommendation-card").filter({ hasText: `${PREFIX} Kathi Roll` });
  await card.getByRole("button", { name: "Save" }).click();
  await expect(card.getByRole("button", { name: "Saved" })).toHaveAttribute("aria-pressed", "true");

  await page.goto("/me");
  const mine = page.getByRole("region", { name: /Posted from this browser/ });
  const saved = page.getByRole("region", { name: /Saved dishes/ });
  await expect(mine.getByTestId("recommendation-card")).toContainText(`${PREFIX} Kathi Roll`);
  await expect(saved.getByTestId("recommendation-card")).toContainText(`${PREFIX} Kathi Roll`);

  await saved.getByRole("button", { name: "Saved" }).click();
  await expect(saved.getByTestId("recommendation-card")).toHaveCount(0);
  await expect(saved.getByText("Tap the bookmark on any dish")).toBeVisible();
});

test("header nav reaches every section and marks the current one", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Discover" })).toHaveAttribute("aria-current", "page");

  await nav.getByRole("link", { name: "Team Favorites" }).click();
  await page.waitForURL(/sort=liked/);
  await expect(nav.getByRole("link", { name: "Team Favorites" })).toHaveAttribute("aria-current", "page");

  await nav.getByRole("link", { name: "Curated Spots" }).click();
  await page.waitForURL("/restaurants");
  await expect(page.getByRole("heading", { level: 1, name: "Curated Spots" })).toBeVisible();

  await page.getByRole("navigation", { name: "Footer" }).getByRole("link", { name: "Tasting Guidelines" }).click();
  await page.waitForURL("/guidelines");
  await expect(page.getByRole("heading", { level: 1, name: "Tasting Guidelines" })).toBeVisible();
});

test("phone menu opens, navigates and closes", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.locator("#mobile-menu").getByRole("link", { name: "Leaderboard" }).click();
  await page.waitForURL("/leaderboard");
  await expect(page.locator("#mobile-menu")).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
