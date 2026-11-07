import { NextRequest, NextResponse } from "next/server";
import { MIN_ADMIN_PASSWORD_LENGTH, audit, getAdminSession, hashPassword } from "@/lib/admin";
import { prisma } from "@/lib/db";

async function ownerAndTarget(ctx: RouteContext<"/api/admin/team/[id]">) {
  const session = await getAdminSession();
  if (!session?.isOwner) {
    return { error: NextResponse.json({ error: "Only the owner can manage admins." }, { status: 403 }) };
  }
  const id = Number((await ctx.params).id);
  const user = Number.isInteger(id) ? await prisma.adminUser.findUnique({ where: { id } }) : null;
  if (!user) return { error: NextResponse.json({ error: "Admin not found." }, { status: 404 }) };
  return { session, user };
}

// Reset password. Existing sessions for this admin stop working, because
// they were issued against the old password hash.
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/team/[id]">) {
  const result = await ownerAndTarget(ctx);
  if ("error" in result) return result.error;
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Passwords need at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }
  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: result.user.id },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.adminSession.deleteMany({ where: { adminUserId: result.user.id } }),
  ]);
  await audit(result.session.actor, "admin_password_reset", {
    targetId: result.user.id,
    detail: result.user.username,
  });
  return NextResponse.json({ ok: true });
}

// Remove an admin; their sessions cascade away with the row.
export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/team/[id]">) {
  const result = await ownerAndTarget(ctx);
  if ("error" in result) return result.error;
  await prisma.adminUser.delete({ where: { id: result.user.id } });
  await audit(result.session.actor, "admin_removed", {
    targetId: result.user.id,
    detail: result.user.username,
  });
  return NextResponse.json({ ok: true });
}
