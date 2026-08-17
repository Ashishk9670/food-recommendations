import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, computeAdminToken } from "@/lib/admin";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  if (isRateLimited(`admin-login:${getClientIp(request)}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const password = body?.password;

  if (typeof password !== "string" || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, computeAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
