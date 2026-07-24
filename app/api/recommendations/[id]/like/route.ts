import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  ctx: RouteContext<"/api/recommendations/[id]/like">,
) {
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

  return NextResponse.json({ likeCount: recommendation.likeCount });
}
