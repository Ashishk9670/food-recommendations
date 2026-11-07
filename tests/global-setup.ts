import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

// This Upstash Redis database is SHARED with production (the free tier caps
// out at one database), so this MUST only ever touch keys scoped to local
// loopback traffic. Every Playwright request hits the local `next dev` server
// directly over loopback, and Next's dev server populates x-forwarded-for with
// "::1" for those connections (confirmed by inspecting real keys — it's not
// "unknown" as getClientIp()'s fallback might suggest). A real request through
// Vercel's edge network always carries a genuine public IP, never "::1", so
// this pattern can never collide with real production rate-limit state. Never
// widen this to a bare "ratelimit:*" wildcard — that would wipe it.
export default async function globalSetup() {
  dotenv.config({ path: ".env.test" });
  const redis = Redis.fromEnv();

  const keys = await redis.keys("ratelimit:*::1*");
  if (keys.length) {
    await redis.del(...keys);
  }

  await ensureSeedImage();
}

// Seeded rows point at recommendation-images/seed.png in the TEST project's
// bucket. Make sure it exists (idempotent), or every seeded card's photo
// 400s and floods the run's output with image-optimizer errors.
async function ensureSeedImage() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return;
  const supabase = createClient(url, key);
  const { error } = await supabase.storage
    .from("recommendation-images")
    .upload("seed.png", readFileSync(path.join(__dirname, "fixtures/test-dish.png")), {
      contentType: "image/png",
      upsert: true,
    });
  if (error) console.warn(`Couldn't ensure the seed image exists: ${error.message}`);
}
