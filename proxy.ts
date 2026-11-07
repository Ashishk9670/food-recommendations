import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-cookie";

// Admin pages stream behind a loading skeleton, so a redirect from inside the
// page can only happen client-side (after a 200). Visitors with no admin
// cookie at all get a real HTTP redirect here instead, before rendering.
// This is only a fast path: every admin page and API still validates the
// session itself (lib/admin.ts), since a cookie being present proves nothing.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  if (request.cookies.has(ADMIN_COOKIE)) return NextResponse.next();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
