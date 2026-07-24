import { createHmac } from "crypto";

export const ADMIN_COOKIE = "admin_session";

export function computeAdminToken(): string {
  return createHmac("sha256", process.env.ADMIN_PASSWORD ?? "")
    .update("admin")
    .digest("hex");
}

export function isValidAdminToken(token: string | undefined): boolean {
  return !!token && token === computeAdminToken();
}
