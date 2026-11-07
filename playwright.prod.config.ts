import { defineConfig, devices } from "@playwright/test";

// Smoke suite against a live deployment (default: production). No local server,
// no direct DB access — everything goes through the public site, the way a
// colleague would use it. The one write test creates a clearly-named dish and
// deletes it again through the owner's Delete button.
//
//   npm run test:prod
//   PROD_URL=https://<preview>.vercel.app npm run test:prod
const baseURL = process.env.PROD_URL ?? "https://food-recommendations-six.vercel.app";

export default defineConfig({
  testDir: "./tests-prod",
  workers: 2,
  timeout: 60_000,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report-prod", open: "never" }]],
  expect: { timeout: 15_000 },
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
});
