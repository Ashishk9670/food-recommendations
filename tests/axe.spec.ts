import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { deleteRecommendationsByPrefix, seedRecommendations } from "./helpers/db";

// Automated WCAG 2.1 AA + best-practice scan (the same axe engine Lighthouse
// uses) over every public page, in both color themes. Catches contrast,
// heading-order and label regressions the moment a token or component
// changes.
const PREFIX = "Axqcheck";
const IMAGE_URL =
  "https://lpnnisusypuadcqyuddh.supabase.co/storage/v1/object/public/recommendation-images/seed.png";

let dishId = 0;

test.beforeAll(async () => {
  await deleteRecommendationsByPrefix(PREFIX);
  const ids = await seedRecommendations([
    {
      dishName: `${PREFIX} Masala Dosa`,
      restaurantName: `${PREFIX} Kitchen`,
      category: "South Indian",
      rating: 4,
      price: 90,
      likeCount: 2,
      imageUrl: IMAGE_URL,
      createdAt: new Date(),
      reviewerName: `${PREFIX} Asha`,
      notes: "Crisp and buttery, with a great chutney.",
    },
    {
      dishName: `${PREFIX} Kathi Roll`,
      restaurantName: `${PREFIX} Kitchen`,
      category: "Rolls & Bowls",
      rating: 3,
      price: 160,
      likeCount: 0,
      imageUrl: IMAGE_URL,
      createdAt: new Date(),
    },
  ]);
  dishId = ids[0];
});

test.afterAll(async () => {
  await deleteRecommendationsByPrefix(PREFIX);
});

const PAGES = [
  "/",
  "/?sort=trending&category=Paneer",
  "/submit",
  "/restaurants",
  `/restaurants/${PREFIX.toLowerCase()}-kitchen`,
  "/leaderboard",
  "/guidelines",
  "/me",
  "/admin/login",
  "/this-page-does-not-exist",
];

// One test per page and theme, so each gets its own time budget (and a
// failure names the exact page) instead of one long test loading them all.
for (const scheme of ["light", "dark"] as const) {
  for (const url of [...PAGES, "dish-detail"]) {
    test(`${url} passes axe in ${scheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(url === "dish-detail" ? `/recommendation/${dishId}` : url);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
        // Next's dev-only error overlay isn't part of the app.
        .exclude("nextjs-portal")
        .analyze();
      const failures = results.violations.map((violation) => {
        const targets = violation.nodes.slice(0, 3).map((node) => node.target.join(" ")).join(" | ");
        return `${violation.id} (${violation.nodes.length}): ${targets}`;
      });
      expect(failures, failures.join("\n")).toEqual([]);
    });
  }
}
