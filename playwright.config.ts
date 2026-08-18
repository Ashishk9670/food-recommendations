import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  workers: 4,
  reporter: "html",
  globalSetup: "./tests/global-setup.ts",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `next dev -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL!,
      SUPABASE_URL: process.env.SUPABASE_URL!,
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY!,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD!,
      SITE_URL: process.env.SITE_URL!,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL!,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN!,
    },
  },
});
