import { NextResponse } from "next/server";
import { audit, endAdminSession } from "@/lib/admin";

export async function POST(request: Request) {
  const session = await endAdminSession();
  if (session) await audit(session.actor, "logout");
  // The dashboard's plain <form method="post"> lands here; send it back to
  // the login page instead of showing raw JSON.
  if (request.headers.get("accept")?.includes("text/html")) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  }
  return NextResponse.json({ ok: true });
}
