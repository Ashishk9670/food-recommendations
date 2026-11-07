import Link from "next/link";
import type { AdminSessionInfo } from "@/lib/admin";

const linkClass =
  "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors";

export default function AdminNav({
  session,
  current,
  reportedCount,
}: {
  session: AdminSessionInfo;
  current: "dashboard" | "reports" | "audit" | "team" | "account";
  reportedCount?: number;
}) {
  const items = [
    { key: "dashboard", href: "/admin", label: "Dashboard" },
    {
      key: "reports",
      href: "/admin/reports",
      label: `Moderation queue${reportedCount ? ` (${reportedCount})` : ""}`,
    },
    { key: "audit", href: "/admin/audit", label: "Audit log" },
    ...(session.isOwner ? [{ key: "team", href: "/admin/team", label: "Team" }] : []),
    { key: "account", href: "/admin/account", label: "My account" },
  ] as const;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border-subtle bg-card p-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label="Admin" className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={item.key === current ? "page" : undefined}
            className={`${linkClass} flex-shrink-0 whitespace-nowrap ${
              item.key === current ? "bg-primary text-on-primary" : "text-muted hover:bg-card-muted hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3 px-1 text-sm">
        <span className="text-muted">
          Signed in as{" "}
          <span data-testid="admin-actor" className="font-semibold text-ink">
            {session.actor}
          </span>
        </span>
        <a href="/api/admin/export" className="font-semibold text-muted hover:text-ink hover:underline">
          Export CSV
        </a>
        <form action="/api/admin/logout" method="post">
          <button type="submit" className="font-semibold text-muted hover:text-ink hover:underline">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
