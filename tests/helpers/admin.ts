import { APIRequestContext, Page } from "@playwright/test";

export async function loginAsAdmin(page: Page, password: string) {
  await page.goto("/admin/login");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log In" }).click();
  await page.waitForURL("/admin");
}

export async function loginAsAdminViaApi(request: APIRequestContext, password: string) {
  const res = await request.post("/api/admin/login", {
    data: { password },
  });
  if (!res.ok()) {
    throw new Error(`Admin login failed: ${res.status()}`);
  }
}
