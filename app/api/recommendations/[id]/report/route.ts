import { createHash } from "crypto";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { RECOMMENDATIONS_TAG } from "@/lib/recommendations";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

const REPORT_LIMIT = 10;
const REPORT_WINDOW_MS = 60 * 1000;

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/recommendations/[id]/report">,
) {
  if (await isRateLimited(`report:${getClientIp(request)}`, REPORT_LIMIT, REPORT_WINDOW_MS)) {
    return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 });
  }

  const { id } = await ctx.params;
  const recommendationId = Number(id);
  if (!Number.isInteger(recommendationId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const reporterIpHash = createHash("sha256").update(getClientIp(request)).digest("hex");

  const result = await prisma
    .$transaction([
      prisma.report.create({ data: { recommendationId, reporterIpHash } }),
      prisma.recommendation.update({
        where: { id: recommendationId },
        data: { reportCount: { increment: 1 } },
      }),
    ])
    .catch(() => null);

  if (!result) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  revalidateTag(RECOMMENDATIONS_TAG, { expire: 0 });

  return NextResponse.json({ ok: true });
}
