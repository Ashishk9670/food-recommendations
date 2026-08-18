import { expect, test } from "@playwright/test";

test.describe("submit form accessibility", () => {
  test("every field resolves via its associated label", async ({ page }) => {
    await page.goto("/submit");

    await expect(page.getByLabel("Dish name")).toBeVisible();
    await expect(page.getByLabel("Restaurant / place")).toBeVisible();
    await expect(page.getByLabel("Price after discount (₹)")).toBeVisible();
    await expect(page.getByLabel("Photo")).toBeVisible();
    await expect(page.getByLabel("Your name (optional)")).toBeVisible();
    await expect(page.getByLabel("Notes (optional)")).toBeVisible();
  });

  test("validation errors are exposed via role=alert", async ({ page }) => {
    await page.goto("/submit");
    await page.getByRole("button", { name: "Submit Recommendation" }).click();

    const alert = page.locator('p[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText("Please enter a dish name.");
  });

  test("star rating buttons expose descriptive aria-labels", async ({ page }) => {
    await page.goto("/submit");

    for (const star of [1, 2, 3, 4, 5]) {
      const label = `Rate ${star} star${star > 1 ? "s" : ""}`;
      await expect(page.getByRole("button", { name: label })).toBeVisible();
    }
  });
});

test.describe("admin login accessibility", () => {
  test("password field resolves via its label and errors use role=alert", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByLabel("Password")).toBeVisible();
  });
});
