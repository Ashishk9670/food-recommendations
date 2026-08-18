import { expect, test } from "@playwright/test";
import { deleteRecommendationsByPrefix, seedRecommendations } from "./helpers/db";

// Trigram-distinct from happy-path.spec.ts's "Zzztest" prefix on purpose —
// fuzzy (word_similarity-based) search means two prefixes sharing even a
// short common root (e.g. both starting "Zzz") can cross-match each other's
// seeded rows, unlike the old plain `contains` substring search.
const SEED_PREFIX = "Qxvbrowse";
const CATEGORIES = ["Biryani", "Chicken", "Paneer", "Chinese", "Other"];
const ROW_COUNT = 14;
const IMAGE_URL =
  "https://lpnnisusypuadcqyuddh.supabase.co/storage/v1/object/public/recommendation-images/seed.png";

function seedDishName(index: number) {
  return `${SEED_PREFIX} Dish ${index}`;
}

const FUZZY_TARGET_DISH_NAME = `${SEED_PREFIX} Chicken Biryani Special`;

// This spec needs >12 rows to exercise pagination, which the real submission
// rate limit (5/10min) can't afford — so it seeds directly into the test
// database via Prisma, bypassing the rate-limited HTTP API entirely, and
// deletes everything it created afterward.
test.describe("browse filters, search, sort, and pagination", () => {
  test.beforeAll(async () => {
    const now = Date.now();
    const rows = Array.from({ length: ROW_COUNT }, (_, index) => ({
      dishName: seedDishName(index),
      restaurantName: `${SEED_PREFIX} Restaurant ${index}`,
      category: CATEGORIES[index % 5],
      rating: (index % 5) + 1,
      price: 100 + index * 50,
      likeCount: index,
      imageUrl: IMAGE_URL,
      createdAt: new Date(now - index * 60_000),
    }));
    rows.push({
      // rating 3 (not 4/5) and price 300 (not under any filter threshold) so
      // this row never interferes with the star/price/sort assertions below —
      // it exists purely to test fuzzy search matching.
      dishName: FUZZY_TARGET_DISH_NAME,
      restaurantName: `${SEED_PREFIX} Spice House`,
      category: "Biryani",
      rating: 3,
      price: 300,
      likeCount: 0,
      imageUrl: IMAGE_URL,
      createdAt: new Date(now),
    });
    await seedRecommendations(rows);
  });

  test.afterAll(async () => {
    await deleteRecommendationsByPrefix(SEED_PREFIX);
  });

  test("search finds seeded rows and pagination shows exactly 12 per page", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByPlaceholder("Search by dish or restaurant...").fill(SEED_PREFIX);
    await page.getByRole("button", { name: "Search" }).click();
    await page.waitForURL(/q=Qxvbrowse/);

    await expect(page.locator(".grid.gap-5 > div")).toHaveCount(12);
    await expect(page.getByRole("link", { name: "← Previous" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Next →" })).toHaveCount(1);

    await page.getByRole("link", { name: "Next →" }).click();
    await expect(page.locator(".grid.gap-5 > div")).toHaveCount(3); // 15 seeded rows total (14 + 1 fuzzy-search target)
    await expect(page.getByRole("link", { name: "Next →" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "← Previous" })).toHaveCount(1);

    await page.getByRole("link", { name: "← Previous" }).click();
    await expect(page.locator(".grid.gap-5 > div")).toHaveCount(12);
    await expect(page.getByRole("link", { name: "← Previous" })).toHaveCount(0);
  });

  test("category filter narrows to only the matching seeded rows", async ({ page }) => {
    await page.goto(`/?q=${SEED_PREFIX}`);
    await page.getByRole("link", { name: "Paneer", exact: true }).click();
    await page.waitForURL(/category=Paneer/);

    const cards = page.locator(".grid.gap-5 > div");
    await expect(cards).toHaveCount(3); // indices 2, 7, 12
    for (const card of await cards.all()) {
      await expect(card.getByText("Paneer", { exact: true })).toBeVisible();
    }
  });

  test("star rating filter combines correctly with an active search", async ({ page }) => {
    await page.goto(`/?q=${SEED_PREFIX}`);
    await page.getByRole("link", { name: "4★ & up" }).click();
    await page.waitForURL(/minStars=4/);

    // ratings are (index % 5) + 1 -> indices 3,8,13 (rating 4) and 4,9 (rating 5)
    await expect(page.locator(".grid.gap-5 > div")).toHaveCount(5);
  });

  test("price filter combines correctly with an active search", async ({ page }) => {
    await page.goto(`/?q=${SEED_PREFIX}`);
    await page.getByRole("link", { name: "Under ₹200" }).click();
    await page.waitForURL(/maxPrice=200/);

    // prices are 100 + index*50 -> indices 0 (100), 1 (150), 2 (200)
    await expect(page.locator(".grid.gap-5 > div")).toHaveCount(3);
  });

  test("Most liked sort orders seeded rows by like count descending", async ({ page }) => {
    await page.goto(`/?q=${SEED_PREFIX}`);
    await page.getByRole("link", { name: "Most liked" }).click();
    await page.waitForURL(/sort=liked/);

    // likeCount equals the seed index, so index 13 (highest) sorts first.
    const firstCard = page.locator(".grid.gap-5 > div").first();
    await expect(firstCard.getByRole("heading", { name: seedDishName(13) })).toBeVisible();
  });

  test("Highest rated sort orders by rating desc, ties broken by newest", async ({ page }) => {
    await page.goto(`/?q=${SEED_PREFIX}`);
    await page.getByRole("link", { name: "Highest rated" }).click();
    await page.waitForURL(/sort=rating/);

    // indices 4 and 9 both have rating 5; index 4 has the more recent createdAt.
    const firstCard = page.locator(".grid.gap-5 > div").first();
    await expect(firstCard.getByRole("heading", { name: seedDishName(4) })).toBeVisible();
  });

  test("Trending sort orders this week's rows by like count descending", async ({ page }) => {
    await page.goto(`/?q=${SEED_PREFIX}`);
    await page.getByRole("link", { name: "Trending" }).click();
    await page.waitForURL(/sort=trending/);

    // all seeded rows are timestamped within the last few minutes (well inside
    // the current ISO week), so trending should order them exactly like "Most liked".
    const firstCard = page.locator(".grid.gap-5 > div").first();
    await expect(firstCard.getByRole("heading", { name: seedDishName(13) })).toBeVisible();
  });

  test("search tolerates a typo via trigram fuzzy matching", async ({ page }) => {
    // "Biryni" is a misspelling of "Biryani" — never a literal substring of
    // FUZZY_TARGET_DISH_NAME, so this only passes if the pg_trgm-backed
    // word_similarity() fallback (not just the plain ILIKE match) is working.
    await page.goto(`/?q=${encodeURIComponent(`${SEED_PREFIX} Biryni`)}`);
    await expect(
      page.getByRole("heading", { name: FUZZY_TARGET_DISH_NAME }),
    ).toBeVisible();
  });

  test("search does not match a completely unrelated query", async ({ page }) => {
    // Deliberately does NOT share the SEED_PREFIX with any seeded row —
    // word_similarity() scores the whole query string, so a shared common word
    // (like a prefix every seeded row happens to share) inflates the score on
    // its own even when the rest of the query is gibberish. A single-word,
    // wholly-unrelated query is the fair test of "does this really not match."
    await page.goto(`/?q=${encodeURIComponent("Xqzvthwplmbfoobarnoise")}`);
    await expect(page.getByText("No recommendations match these filters yet.")).toBeVisible();
  });

  test("empty state shows when filters match nothing", async ({ page }) => {
    await page.goto(`/?q=${SEED_PREFIX}`);
    await page.getByRole("link", { name: "Biryani", exact: true }).click();
    await page.waitForURL(/category=Biryani/);
    // Biryani rows (indices 0, 5, 10) have ratings 1, 2, 1 — none reach 4★.
    await page.getByRole("link", { name: "4★ & up" }).click();
    await page.waitForURL(/minStars=4/);

    await expect(page.getByText("No recommendations match these filters yet.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Be the first to submit one" })).toBeVisible();
  });
});
