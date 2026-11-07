import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { AUDIT_LABELS, requireAdminPage, type AuditAction } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_LIMIT = 200;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ actor?: string }>;
}) {
  const session = await requireAdminPage();
  const { actor } = await searchParams;

  const [entries, actors] = await Promise.all([
    prisma.auditLog.findMany({
      where: actor ? { actor } : undefined,
      orderBy: { createdAt: "desc" },
      take: PAGE_LIMIT,
    }),
    prisma.auditLog.findMany({ distinct: ["actor"], select: { actor: true }, orderBy: { actor: "asc" } }),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <AdminNav session={session} current="audit" />
      <h1 className="text-2xl font-bold text-ink">Audit log</h1>
      <p className="mb-5 mt-1 text-sm text-muted">
        Every admin sign-in and moderation action, newest first (last {PAGE_LIMIT}).
      </p>

      {actors.length > 1 && (
        <div className="scrollbar-none mb-4 flex gap-2 overflow-x-auto">
          {[{ actor: undefined }, ...actors].map((row) => {
            const active = row.actor === actor;
            return (
              <Link
                key={row.actor ?? "all"}
                href={row.actor ? `/admin/audit?actor=${encodeURIComponent(row.actor)}` : "/admin/audit"}
                aria-current={active ? "true" : undefined}
                className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
                  active ? "bg-primary text-on-primary" : "border border-border-subtle bg-card text-ink hover:bg-card-muted"
                }`}
              >
                {row.actor ?? "Everyone"}
              </Link>
            );
          })}
        </div>
      )}

      <ol className="divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-card shadow-card">
        {entries.map((entry) => (
          <li
            key={entry.id}
            data-testid="audit-row"
            className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <time
              dateTime={entry.createdAt.toISOString()}
              className="w-40 flex-shrink-0 text-xs tabular-nums text-faint"
            >
              {entry.createdAt.toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Kolkata",
              })}
            </time>
            <span className="w-28 flex-shrink-0 truncate text-sm font-semibold text-ink">{entry.actor}</span>
            <span
              className={`text-sm ${entry.action === "login_failed" ? "font-semibold text-danger" : "text-ink"}`}
            >
              {AUDIT_LABELS[entry.action as AuditAction] ?? entry.action}
              {entry.detail && <span className="text-muted"> · {entry.detail}</span>}
            </span>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="px-6 py-12 text-center text-sm text-muted">Nothing recorded yet.</li>
        )}
      </ol>
    </div>
  );
}
