import { expect, test, type Browser } from "@playwright/test";
import {
  createAdminSessionCookie,
  createAdminUser,
  deleteAdminUsersByPrefix,
  deleteRecommendationsByPrefix,
  seedRecommendations,
} from "./helpers/db";

// Usernames and the dish name use prefixes no other spec searches for.
const PREFIX = "zzqteam";
const DISH_PREFIX = "Qmtwharf";
const IMAGE_URL =
  "https://lpnnisusypuadcqyuddh.supabase.co/storage/v1/object/public/recommendation-images/seed.png";

function suffix() {
  return Math.random().toString(36).replace(/[^a-z]/g, "").slice(0, 6);
}

async function ownerPage(browser: Browser) {
  const context = await browser.newContext();
  await context.addCookies([await createAdminSessionCookie(null)]);
  const page = await context.newPage();
  page.on("dialog", (dialog) => dialog.accept());
  return page;
}

test.afterAll(async () => {
  await deleteAdminUsersByPrefix(PREFIX);
  await deleteRecommendationsByPrefix(DISH_PREFIX);
});

// The only real /api/admin/login call in this file (the team admin's own
// sign-in); everything else uses DB-created sessions.
test("owner adds an admin, who can moderate; removal signs them out; all of it is audited", async ({
  browser,
}) => {
  test.setTimeout(process.env.CI ? 120_000 : 60_000);
  const username = `${PREFIX}${suffix()}`;
  const password = "correct-horse-battery";
  const dishName = `${DISH_PREFIX} Platter ${suffix()}`;
  const owner = await ownerPage(browser);

  await test.step("owner adds the admin on the team page", async () => {
    await owner.goto("/admin/team");
    await expect(owner.getByTestId("admin-actor")).toHaveText("owner");
    await owner.getByLabel("Username").fill(username);
    await owner.getByLabel("Password").fill(password);
    await owner.getByRole("button", { name: "Add admin" }).click();
    await expect(owner.getByTestId("team-row").filter({ hasText: username })).toBeVisible();
  });

  await seedRecommendations([
    {
      dishName,
      restaurantName: `${DISH_PREFIX} Kitchen`,
      category: "Other",
      rating: 3,
      price: 150,
      likeCount: 0,
      imageUrl: IMAGE_URL,
      createdAt: new Date(),
    },
  ]);

  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  admin.on("dialog", (dialog) => dialog.accept());

  await test.step("the new admin signs in and sees no team management", async () => {
    await admin.goto("/admin/login");
    await admin.getByLabel("Username").fill(username);
    await admin.getByLabel("Password").fill(password);
    await admin.getByRole("button", { name: "Log In" }).click();
    await admin.waitForURL("/admin");
    await expect(admin.getByTestId("admin-actor")).toHaveText(username);
    await expect(
      admin.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Team", exact: true }),
    ).toHaveCount(0);
    await admin.goto("/admin/team");
    await admin.waitForURL("/admin");
  });

  await test.step("the admin deletes a post", async () => {
    const row = admin.getByTestId("admin-row").filter({ hasText: dishName });
    await row.getByRole("button", { name: "Delete" }).click();
    await expect(admin.getByText(dishName)).toHaveCount(0);
  });

  await test.step("the audit log names who did what", async () => {
    await admin.goto(`/admin/audit?actor=${username}`);
    const rows = admin.getByTestId("audit-row");
    await expect(rows.filter({ hasText: "Deleted a recommendation" }).filter({ hasText: dishName })).toHaveCount(1);
    await expect(rows.filter({ hasText: "Signed in" })).toHaveCount(1);
  });

  await test.step("owner removes the admin, which ends their session", async () => {
    await owner.goto("/admin/team");
    await owner.getByRole("button", { name: `Remove ${username}` }).click();
    await expect(owner.getByTestId("team-row").filter({ hasText: username })).toHaveCount(0);

    await admin.goto("/admin");
    await admin.waitForURL("/admin/login");

    await owner.goto("/admin/audit?actor=owner");
    await expect(
      owner.getByTestId("audit-row").filter({ hasText: "Removed an admin" }).filter({ hasText: username }),
    ).toHaveCount(1);
  });

  await adminContext.close();
  await owner.context().close();
});

test("resetting an admin's password signs out their existing sessions", async ({ browser }) => {
  const username = `${PREFIX}r${suffix()}`;
  const user = await createAdminUser(username, "old-password-123");

  const adminContext = await browser.newContext();
  await adminContext.addCookies([await createAdminSessionCookie(user)]);
  const admin = await adminContext.newPage();
  await admin.goto("/admin");
  await expect(admin.getByTestId("admin-actor")).toHaveText(username);

  const owner = await ownerPage(browser);
  owner.removeAllListeners("dialog");
  owner.on("dialog", (dialog) =>
    dialog.type() === "prompt" ? dialog.accept("new-password-456") : dialog.accept(),
  );
  await owner.goto("/admin/team");
  await owner.getByTestId("team-row").filter({ hasText: username }).getByRole("button", { name: "Reset password" }).click();
  await expect(owner.getByRole("status")).toContainText(`Password reset for ${username}`);

  await admin.goto("/admin");
  await admin.waitForURL("/admin/login");

  await adminContext.close();
  await owner.context().close();
});

test("only the owner can manage the team, and bad input is rejected", async ({ browser, playwright }) => {
  const anonymous = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  expect((await anonymous.post("/api/admin/team", { data: { username: "x", password: "y" } })).status()).toBe(403);
  await anonymous.dispose();

  const existing = `${PREFIX}n${suffix()}`;
  const user = await createAdminUser(existing, "some-password-1");
  const adminContext = await browser.newContext();
  await adminContext.addCookies([await createAdminSessionCookie(user)]);
  const asAdmin = await adminContext.request.post("/api/admin/team", {
    data: { username: `${PREFIX}x${suffix()}`, password: "long-enough-pass" },
  });
  expect(asAdmin.status()).toBe(403);
  expect((await adminContext.request.delete(`/api/admin/team/${user.id}`)).status()).toBe(403);
  await adminContext.close();

  const owner = await ownerPage(browser);
  const post = (data: object) => owner.request.post("/api/admin/team", { data });
  expect((await post({ username: "owner", password: "long-enough-pass" })).status()).toBe(400);
  expect((await post({ username: "Bad Name!", password: "long-enough-pass" })).status()).toBe(400);
  expect((await post({ username: `${PREFIX}s${suffix()}`, password: "short" })).status()).toBe(400);
  expect((await post({ username: existing, password: "long-enough-pass" })).status()).toBe(409);
  await owner.context().close();
});
