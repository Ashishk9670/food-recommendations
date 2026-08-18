import { expect, test } from "@playwright/test";

// Only ONE real call to /api/admin/login happens in this file (the wrong-password
// attempt) — the "correct password" path is exercised once, in happy-path.spec.ts,
// so the whole suite's admin-login rate-limit usage (5/15min) stays small enough
// to survive two back-to-back full-suite runs.
test.describe("admin authentication", () => {
  test("visiting /admin while logged out redirects to the login page", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL("/admin/login");
  });

  test("an incorrect password is rejected and grants no access", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Password").fill("definitely-the-wrong-password");
    await page.getByRole("button", { name: "Log In" }).click();

    await expect(page.locator('p[role="alert"]')).toHaveText("Incorrect password.");
    expect(page.url()).toContain("/admin/login");

    await page.goto("/admin");
    await page.waitForURL("/admin/login");
  });
});
