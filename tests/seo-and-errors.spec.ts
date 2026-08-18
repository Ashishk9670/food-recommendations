import { expect, test } from "@playwright/test";

test.describe("SEO endpoints and error pages", () => {
  test("/sitemap.xml is valid XML listing the browse and submit pages", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.ok()).toBe(true);
    expect(res.headers()["content-type"]).toContain("xml");

    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("/submit</loc>");
  });

  test("/robots.txt disallows /admin and /api", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.ok()).toBe(true);

    const body = await res.text();
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Disallow: /api");
    expect(body).toContain("Sitemap:");
  });

  test("/opengraph-image returns a real PNG image", async ({ request }) => {
    const res = await request.get("/opengraph-image");
    expect(res.ok()).toBe(true);
    expect(res.headers()["content-type"]).toContain("image/png");

    const body = await res.body();
    expect(body.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  });

  test("an unknown route shows the branded 404 page with a real 404 status", async ({
    page,
    request,
  }) => {
    const res = await request.get("/this-page-does-not-exist");
    expect(res.status()).toBe(404);

    await page.goto("/this-page-does-not-exist");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse Recommendations" })).toBeVisible();
  });
});
