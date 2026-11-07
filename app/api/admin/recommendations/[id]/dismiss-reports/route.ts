import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { audit, getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { RECOMMENDATIONS_TAG } from "@/lib/recommendations";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/admin/recommendations/[id]/dismiss-reports">,
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const recommendationId = Number(id);
  if (!Number.isInteger(recommendationId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const result = await prisma
    .$transaction([
      prisma.report.updateMany({
        where: { recommendationId, dismissed: false },
        data: { dismissed: true },
      }),
      prisma.recommendation.update({
        where: { id: recommendationId },
        data: { reportCount: 0 },
        select: { dishName: true },
      }),
    ])
    .catch(() => null);

  if (!result) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await audit(session.actor, "dismiss_reports", {
    targetId: recommendationId,
    detail: `${result[1].dishName} (${result[0].count} report${result[0].count === 1 ? "" : "s"})`,
  });
  revalidateTag(RECOMMENDATIONS_TAG, { expire: 0 });

  return NextResponse.json({ ok: true });
}
