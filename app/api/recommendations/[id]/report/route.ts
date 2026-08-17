import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

const REPORT_LIMIT = 10;
const REPORT_WINDOW_MS = 60 * 1000;

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/recommendations/[id]/report">,
) {
  if (isRateLimited(`report:${getClientIp(request)}`, REPORT_LIMIT, REPORT_WINDOW_MS)) {
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
      data: { reportCount: { increment: 1 } },
    })
    .catch(() => null);

  if (!recommendation) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
