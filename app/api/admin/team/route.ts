import { NextRequest, NextResponse } from "next/server";
import {
  MIN_ADMIN_PASSWORD_LENGTH,
  OWNER_ACTOR,
  USERNAME_PATTERN,
  audit,
  getAdminSession,
  hashPassword,
} from "@/lib/admin";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session?.isOwner) {
    return NextResponse.json({ error: "Only the owner can manage admins." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!USERNAME_PATTERN.test(username) || username === OWNER_ACTOR) {
    return NextResponse.json(
      {
        error:
          "Usernames are 3–32 characters: lowercase letters, numbers, dots, dashes or underscores (and not “owner”).",
      },
      { status: 400 },
    );
  }
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Passwords need at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }
  if (await prisma.adminUser.findUnique({ where: { username } })) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  const user = await prisma.adminUser.create({
    data: { username, passwordHash: await hashPassword(password), createdBy: session.actor },
    select: { id: true, username: true, createdBy: true, createdAt: true },
  });
  await audit(session.actor, "admin_added", { targetId: user.id, detail: username });
  return NextResponse.json(user, { status: 201 });
}
