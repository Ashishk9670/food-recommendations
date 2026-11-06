import { expect, test, type Page } from "@playwright/test";
import { deleteRecommendationsByPrefix, seedRecommendations } from "./helpers/db";

// Trigram-distinct from every other spec's search query (e.g. "Qxvbrowse"):
// the browse page's fuzzy search would otherwise match these rows whenever
// both specs happen to run concurrently.
const PREFIX = "Jfwbellping";
const IMAGE_URL =
  "https://lpnnisusypuadcqyuddh.supabase.co/storage/v1/object/public/recommendation-images/seed.png";

// Other spec files seed rows concurrently with createdAt = now, so counting
// "new since now" would be flaky. Every row here is created in a far-future
// window that nothing else ever writes to, and the bell's last-seen time is
// pinned just before it — so the count is exactly this file's rows.
const LAST_SEEN = "2099-01-01T00:00:00.000Z";
const CREATED_AT = new Date("2099-01-01T00:01:00.000Z");

test.afterEach(async () => {
  await deleteRecommendationsByPrefix(PREFIX);
});

async function seedOne(dishName: string): Promise<number> {
  const [id] = await seedRecommendations([
    {
      dishName,
      restaurantName: `${PREFIX} Restaurant`,
      category: "Other",
      rating: 4,
      price: 199,
      likeCount: 0,
      imageUrl: IMAGE_URL,
      createdAt: CREATED_AT,
    },
  ]);
  return id;
}

// Asserting the badge is *absent* would pass trivially before the bell's first
// poll returns, so every reload waits for that response before asserting.
async function reloadAndWaitForPoll(page: Page) {
  await Promise.all([
    page.waitForResponse((res) => res.url().includes("/api/recommendations/new")),
    page.reload(),
  ]);
}

async function visitWithLastSeen(page: Page, ownIds: number[] = []) {
  await page.goto("/submit");
  await page.evaluate(
    ([seen, ids]) => {
      localStorage.setItem("notificationsLastSeen", seen as string);
      const tokens = Object.fromEntries((ids as number[]).map((id) => [id, "own"]));
      localStorage.setItem("myRecommendationTokens", JSON.stringify(tokens));
    },
    [LAST_SEEN, ownIds],
  );
  await reloadAndWaitForPoll(page);
}

test("bell counts reviews others submitted since last seen, and clears once opened", async ({
  page,
}) => {
  const dishName = `${PREFIX} Dish`;
  await seedOne(dishName);
  await visitWithLastSeen(page);

  const badge = page.getByTestId("notification-count");
  await expect(badge).toHaveText("1");

  await page.getByRole("button", { name: /^Notifications/ }).click();
  await expect(page.getByRole("link", { name: new RegExp(dishName) })).toBeVisible();
  await expect(badge).toHaveCount(0);

  // Opening marked it seen — still cleared after a reload.
  await reloadAndWaitForPoll(page);
  await expect(badge).toHaveCount(0);
});

test("a poll still in flight when the bell is opened can't resurrect already-seen items", async ({
  page,
}) => {
  await seedOne(`${PREFIX} Racing`);
  await visitWithLastSeen(page);
  const badge = page.getByTestId("notification-count");
  await expect(badge).toHaveText("1");

  // Hold the next poll open, start it (a focus event triggers a refresh using
  // the *old* last-seen time), then open the bell while it's still pending.
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/api/recommendations/new**", async (route) => {
    await gate;
    await route.continue();
  });
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.getByRole("button", { name: /^Notifications/ }).click();
  await expect(badge).toHaveCount(0);

  const stale = page.waitForResponse((res) => res.url().includes("/api/recommendations/new"));
  release();
  await stale;
  // Negative assertion after an async state update: give React a beat to
  // apply the stale response before checking it was correctly ignored.
  await page.waitForTimeout(500);
  await expect(badge).toHaveCount(0);
});

test("your own submissions never count toward your bell", async ({ page }) => {
  const id = await seedOne(`${PREFIX} Mine`);
  await visitWithLastSeen(page, [id]);

  await expect(page.getByTestId("notification-count")).toHaveCount(0);
});

test("the new-since API rejects a missing or invalid timestamp", async ({ request }) => {
  expect((await request.get("/api/recommendations/new")).status()).toBe(400);
  expect((await request.get("/api/recommendations/new?since=not-a-date")).status()).toBe(400);

  const ok = await request.get(`/api/recommendations/new?since=${encodeURIComponent(LAST_SEEN)}`);
  expect(ok.status()).toBe(200);
  expect(Array.isArray((await ok.json()).items)).toBe(true);
});
