import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { RECOMMENDATIONS_TAG } from "@/lib/recommendations";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

const LIKE_LIMIT = 30;
const LIKE_WINDOW_MS = 60 * 1000;

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/recommendations/[id]/like">,
) {
  if (await isRateLimited(`like:${getClientIp(request)}`, LIKE_LIMIT, LIKE_WINDOW_MS)) {
    return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 });
  }

  const { id } = await ctx.params;
  const recommendationId = Number(id);
  if (!Number.isInteger(recommendationId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const recommendation = await prisma.recommendation
    .update({
      where: { id: recommendationId },
      data: { likeCount: { increment: 1 } },
    })
    .catch(() => null);

  if (!recommendation) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  revalidateTag(RECOMMENDATIONS_TAG, { expire: 0 });

  return NextResponse.json({ likeCount: recommendation.likeCount });
}
