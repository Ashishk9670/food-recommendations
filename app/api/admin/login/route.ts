import { NextRequest, NextResponse } from "next/server";
import { OWNER_ACTOR, audit, safeEqual, startAdminSession, verifyPassword } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// A blank username means the owner account (ADMIN_PASSWORD), so the owner
// signs in exactly as before named admin accounts existed.
export async function POST(request: NextRequest) {
  if (await isRateLimited(`admin-login:${getClientIp(request)}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const password = body?.password;
  const username =
    typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";

  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  if (!username || username === OWNER_ACTOR) {
    const ownerPassword = process.env.ADMIN_PASSWORD;
    if (!ownerPassword || !safeEqual(password, ownerPassword)) {
      await audit(OWNER_ACTOR, "login_failed");
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }
    await startAdminSession(null);
    await audit(OWNER_ACTOR, "login");
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.adminUser.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    // Only log attempts against real accounts, so the log can't be filled
    // with arbitrary attacker-chosen names.
    if (user) await audit(user.username, "login_failed");
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }
  await startAdminSession(user);
  await audit(user.username, "login");
  return NextResponse.json({ ok: true });
}
