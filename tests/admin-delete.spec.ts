import { expect, test } from "@playwright/test";
import { deleteRecommendationsByPrefix, seedRecommendations } from "./helpers/db";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const PREFIX = "Zzzadmindelete";
const IMAGE_URL =
  "https://lpnnisusypuadcqyuddh.supabase.co/storage/v1/object/public/recommendation-images/seed.png";

// Dedicated, isolated coverage for admin delete (reported as apparently broken
// in production — turned out to be a dismissed/uncounted browser confirm()
// dialog, not the delete logic itself). Seeds directly via the DB helper so
// this test needs zero submission calls, only its own real admin login.
test.afterAll(async () => {
  await deleteRecommendationsByPrefix(PREFIX);
});

test("admin can delete a recommendation from the dashboard", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());

  const dishName = `${PREFIX} Dish`;
  await seedRecommendations([
    {
      dishName,
      restaurantName: `${PREFIX} Restaurant`,
      category: "Other",
      rating: 4,
      price: 199,
      likeCount: 0,
      imageUrl: IMAGE_URL,
      createdAt: new Date(),
    },
  ]);

  await page.goto("/admin/login");
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Log In" }).click();
  await page.waitForURL("/admin");

  const row = page.locator("div.rounded-xl").filter({ hasText: dishName });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(dishName)).toHaveCount(0);

  await page.goto(`/?q=${encodeURIComponent(dishName)}`);
  await expect(page.getByRole("heading", { name: dishName })).toHaveCount(0);
});
