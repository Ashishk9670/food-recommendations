import { NextRequest } from "next/server";

// In-memory sliding-window limiter. Resets on server restart and is per-instance,
// so it won't hold up across multiple serverless instances — fine for now while
// this app runs as a single SQLite-backed process; revisit alongside the prod DB swap.
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
