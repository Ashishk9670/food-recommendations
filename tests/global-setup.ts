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
}
