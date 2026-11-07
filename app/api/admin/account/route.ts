import { NextRequest, NextResponse } from "next/server";
import {
  MIN_ADMIN_PASSWORD_LENGTH,
  audit,
  getAdminSession,
  hashPassword,
  startAdminSession,
  verifyPassword,
} from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

// A team admin changes their own password. Every existing session of theirs
// (other browsers too) ends, and this browser gets a fresh one so they stay
// signed in here. The owner's password is ADMIN_PASSWORD, managed in Vercel.
export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (session.isOwner || session.adminUserId === null) {
    return NextResponse.json(
      { error: "The owner password is ADMIN_PASSWORD, set in Vercel's environment variables." },
      { status: 400 },
    );
  }
  // The current-password check is a password guess, so it's rate-limited
  // like login (in its own bucket).
  if (await isRateLimited(`admin-password:${getClientIp(request)}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  const user = await prisma.adminUser.findUnique({ where: { id: session.adminUserId } });
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
  }
  if (newPassword.length < MIN_ADMIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `New passwords need at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: "Choose a password different from the current one." }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.adminSession.deleteMany({ where: { adminUserId: user.id } }),
  ]);
  await startAdminSession({ id: user.id, passwordHash });
  await audit(user.username, "password_changed", { targetId: user.id });
  return NextResponse.json({ ok: true });
}
