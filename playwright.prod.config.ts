import { defineConfig, devices } from "@playwright/test";

// Smoke suite against a live deployment (default: production). No local server,
// no direct DB access — everything goes through the public site, the way a
// colleague would use it. The one write test creates a clearly-named dish and
// deletes it again through the owner's Delete button.
//
//   npm run test:prod
//   PROD_URL=https://<preview>.vercel.app npm run test:prod
//
// The write test makes 2 real submissions (the dish, then a rejected
// duplicate) against the live 5-per-10-minutes-per-IP limit, so run the
// suite at most twice in any 10 minutes or it fails with "Too many
// submissions".
const baseURL = process.env.PROD_URL ?? "https://food-recommendations-six.vercel.app";

export default defineConfig({
  testDir: "./tests-prod",
  workers: 2,
  timeout: 60_000,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report-prod", open: "never" }],
    // Inline failure annotations on the GitHub Actions run page.
    ...(process.env.CI ? [["github"] as ["github"]] : []),
  ],
  // One retry on CI so a single network blip doesn't page anyone.
  retries: process.env.CI ? 1 : 0,
  expect: { timeout: 15_000 },
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
});
