import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

const redis = Redis.fromEnv();

const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs / 1000} s`),
      prefix: "ratelimit",
      analytics: false,
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

// Redis-backed so limits actually hold across Vercel's ephemeral serverless
// instances — the previous in-memory Map only limited requests hitting the
// same warm instance, which on serverless is close to no protection at all.
export async function isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
  const { success } = await getLimiter(limit, windowMs).limit(key);
  return !success;
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
