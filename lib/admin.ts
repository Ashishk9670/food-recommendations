import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const ADMIN_COOKIE = "admin_session";
export const OWNER_ACTOR = "owner";
const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7;

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;
export const MIN_ADMIN_PASSWORD_LENGTH = 10;

export type AdminSessionInfo = {
  actor: string;
  isOwner: boolean;
  adminUserId: number | null;
};

// ---------- passwords ----------

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// Constant-time string compare for the owner password.
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(sha256(a));
  const right = Buffer.from(sha256(b));
  return timingSafeEqual(left, right);
}

function ownerFingerprint(): string {
  return sha256(`owner:${process.env.ADMIN_PASSWORD ?? ""}`).slice(0, 32);
}

function userFingerprint(passwordHash: string): string {
  return sha256(`user:${passwordHash}`).slice(0, 32);
}

// ---------- sessions ----------

export async function startAdminSession(user: { id: number; passwordHash: string } | null) {
  const token = randomBytes(32).toString("base64url");
  await prisma.adminSession.create({
    data: {
      tokenHash: sha256(token),
      adminUserId: user?.id ?? null,
      credentialFingerprint: user ? userFingerprint(user.passwordHash) : ownerFingerprint(),
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_S * 1000),
    },
  });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
}

// Deduped per request: pages and route handlers can call it freely.
export const getAdminSession = cache(async (): Promise<AdminSessionInfo | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token || !process.env.ADMIN_PASSWORD) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { adminUser: true },
  });
  if (!session || session.expiresAt < new Date()) return null;

  if (session.adminUserId === null) {
    if (session.credentialFingerprint !== ownerFingerprint()) return null;
    return { actor: OWNER_ACTOR, isOwner: true, adminUserId: null };
  }
  // A removed admin's sessions cascade away; a reset password changes the
  // fingerprint. Either way the old cookie stops working.
  if (!session.adminUser || session.credentialFingerprint !== userFingerprint(session.adminUser.passwordHash)) {
    return null;
  }
  return { actor: session.adminUser.username, isOwner: false, adminUserId: session.adminUser.id };
});

export async function endAdminSession(): Promise<AdminSessionInfo | null> {
  const session = await getAdminSession();
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token) await prisma.adminSession.deleteMany({ where: { tokenHash: sha256(token) } });
  cookieStore.delete(ADMIN_COOKIE);
  return session;
}

// For admin pages: bounce to the login page (or the dashboard, for
// owner-only pages) instead of rendering.
export async function requireAdminPage(opts: { ownerOnly?: boolean } = {}): Promise<AdminSessionInfo> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (opts.ownerOnly && !session.isOwner) redirect("/admin");
  return session;
}

// ---------- audit log ----------

export type AuditAction =
  | "login"
  | "login_failed"
  | "logout"
  | "delete_recommendation"
  | "dismiss_reports"
  | "export_csv"
  | "admin_added"
  | "admin_removed"
  | "admin_password_reset";

export const AUDIT_LABELS: Record<AuditAction, string> = {
  login: "Signed in",
  login_failed: "Failed sign-in",
  logout: "Signed out",
  delete_recommendation: "Deleted a recommendation",
  dismiss_reports: "Dismissed reports",
  export_csv: "Exported CSV",
  admin_added: "Added an admin",
  admin_removed: "Removed an admin",
  admin_password_reset: "Reset an admin's password",
};

// Never lets a logging failure break the action being logged.
export async function audit(
  actor: string,
  action: AuditAction,
  details: { targetId?: number; detail?: string } = {},
) {
  await prisma.auditLog
    .create({ data: { actor, action, targetId: details.targetId, detail: details.detail?.slice(0, 300) } })
    .catch((err) => console.error("audit log write failed", err));
}
