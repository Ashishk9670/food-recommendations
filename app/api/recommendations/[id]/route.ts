import { unlink } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/recommendations/[id]">,
) {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const recommendationId = Number(id);
  if (!Number.isInteger(recommendationId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const recommendation = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
  });
  if (!recommendation) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.recommendation.delete({ where: { id: recommendationId } });

  if (recommendation.imageUrl.startsWith("/uploads/")) {
    await unlink(
      path.join(process.cwd(), "public", recommendation.imageUrl),
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
