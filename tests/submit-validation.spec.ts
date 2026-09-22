import path from "node:path";
import { expect, test } from "@playwright/test";

const TEST_IMAGE = path.join(__dirname, "fixtures/test-dish.png");
const TEST_IMAGE_2 = path.join(__dirname, "fixtures/test-dish-2.png");

// Every case here is blocked by client-side validation in app/submit/page.tsx
// before fetch() is ever called, so none of this touches the rate-limited
// POST /api/recommendations endpoint.
test.describe("submit form validation", () => {
  test("required-field errors appear in order as the form is progressively filled", async ({
    page,
  }) => {
    await page.goto("/submit");
    const submit = page.getByRole("button", { name: "Submit Recommendation" });

    await submit.click();
    await expect(page.locator('p[role="alert"]')).toHaveText("Please enter a dish name.");

    await page.getByLabel("Dish name").fill("Test Dish");
    await submit.click();
    await expect(page.locator('p[role="alert"]')).toHaveText(
      "Please enter the restaurant or place name.",
    );

    await page.getByLabel("Restaurant / place").fill("Test Restaurant");
    await submit.click();
    await expect(page.locator('p[role="alert"]')).toHaveText("Please choose a star rating.");

    await page.getByRole("button", { name: "Rate 5 stars" }).click();
    await submit.click();
    await expect(page.locator('p[role="alert"]')).toContainText("Please enter a valid price");

    await page.getByLabel("Price after discount (₹)").fill("199");
    await submit.click();
    await expect(page.locator('p[role="alert"]')).toHaveText("Please choose at least one photo.");
  });

  test("the no-photo error clears as soon as a photo is chosen, and stays cleared after removing it", async ({
    page,
  }) => {
    await page.goto("/submit");
    const submit = page.getByRole("button", { name: "Submit Recommendation" });

    await page.getByLabel("Dish name").fill("Test Dish");
    await page.getByLabel("Restaurant / place").fill("Test Restaurant");
    await page.getByRole("button", { name: "Rate 5 stars" }).click();
    await page.getByLabel("Price after discount (₹)").fill("199");
    await submit.click();
    await expect(page.locator('p[role="alert"]')).toHaveText("Please choose at least one photo.");

    await page.getByLabel("Upload photos").setInputFiles(TEST_IMAGE);
    await expect(page.locator('p[role="alert"]')).toHaveCount(0);

    await page.getByRole("button", { name: "Remove photo 1" }).click();
    await expect(page.getByAltText("Preview 1")).toHaveCount(0);
    // Removing the only photo doesn't resurrect the error on its own — it
    // only reappears if the user actually tries to submit again like this.
    await expect(page.locator('p[role="alert"]')).toHaveCount(0);

    await submit.click();
    await expect(page.locator('p[role="alert"]')).toHaveText("Please choose at least one photo.");
  });

  test("dish name field strips non-letter characters as you type", async ({ page }) => {
    await page.goto("/submit");
    const dishName = page.getByLabel("Dish name");
    await dishName.fill("Bir123yani!@# Bowl");
    await expect(dishName).toHaveValue("Biryani Bowl");
  });

  test("restaurant name field strips non-letter characters as you type", async ({ page }) => {
    await page.goto("/submit");
    const restaurantName = page.getByLabel("Restaurant / place");
    await restaurantName.fill("Spice123 Route!!");
    await expect(restaurantName).toHaveValue("Spice Route");
  });

  test("price field accepts a valid decimal amount", async ({ page }) => {
    // The field is type="number", so the browser itself already blocks letters
    // from being entered — stripNonPriceChars only ever sees digits and dots.
    await page.goto("/submit");
    const price = page.getByLabel("Price after discount (₹)");
    await price.fill("199.50");
    await expect(price).toHaveValue("199.50");
  });

  test("live category badge updates as the dish name changes", async ({ page }) => {
    await page.goto("/submit");
    const dishName = page.getByLabel("Dish name");

    await dishName.fill("Hyderabadi Chicken Biryani");
    await expect(page.getByText("Detected category:")).toBeVisible();
    await expect(page.getByText("Biryani", { exact: true })).toBeVisible();

    // Chinese keywords are checked before Chicken, so a dish naming both
    // should be classified as Chinese, not Chicken.
    await dishName.fill("Chicken Manchurian");
    await expect(page.getByText("Chinese", { exact: true })).toBeVisible();

    await dishName.fill("Butter Chicken");
    await expect(page.getByText("Chicken", { exact: true })).toBeVisible();

    await dishName.fill("Paneer Tikka");
    await expect(page.getByText("Paneer", { exact: true })).toBeVisible();

    await dishName.fill("Mystery Dessert");
    await expect(page.getByText("Other", { exact: true })).toBeVisible();
  });

  test("the camera button only shows on phone-sized viewports; upload always shows", async ({
    page,
  }) => {
    await page.goto("/submit");
    const takePhoto = page.getByRole("button", { name: "Take Photo" });
    const upload = page.getByRole("button", { name: "Upload Photos" });

    // Default Playwright viewport (1280x720) is well above the sm breakpoint.
    await expect(takePhoto).toBeHidden();
    await expect(upload).toBeVisible();

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(takePhoto).toBeVisible();
    await expect(upload).toBeVisible();
  });

  test("taking a photo adds to the selection instead of replacing what was already uploaded", async ({
    page,
  }) => {
    await page.goto("/submit");

    await page.getByLabel("Upload photos").setInputFiles([TEST_IMAGE, TEST_IMAGE_2]);
    await expect(page.getByAltText(/^Preview/)).toHaveCount(2);

    // A camera capture (simulated the same way Playwright simulates any file
    // input — real camera hardware isn't invokable in a headless test) should
    // append, not replace, the two already chosen via upload.
    await page.getByLabel("Take photo").setInputFiles(TEST_IMAGE);
    await expect(page.getByAltText(/^Preview/)).toHaveCount(3);
  });
});
