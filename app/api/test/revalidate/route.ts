import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { RECOMMENDATIONS_TAG } from "@/lib/recommendations";

// Dev-only escape hatch for Playwright: test seeding/cleanup writes rows
// directly via SQL (to stay under the real rate limits), which bypasses every
// app mutation route and therefore never calls revalidateTag — this endpoint
// lets the test helpers bust the browse-page cache after doing that.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  revalidateTag(RECOMMENDATIONS_TAG, { expire: 0 });

  return NextResponse.json({ ok: true });
}
