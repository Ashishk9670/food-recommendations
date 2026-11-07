import Link from "next/link";
import type { Prisma } from "@/app/generated/prisma/client";
import AdminNav from "@/components/AdminNav";
import { AUDIT_LABELS, requireAdminPage, type AuditAction } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_LIMIT = 200;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Dates are whole days in IST — the same zone the log is displayed in.
function istDayStart(day: string) {
  return new Date(`${day}T00:00:00.000+05:30`);
}
function istDayEnd(day: string) {
  return new Date(`${day}T23:59:59.999+05:30`);
}

type Filters = { actor?: string; action?: string; from?: string; to?: string };

function hrefWith(filters: Filters, change: Partial<Filters>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, ...change })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/admin/audit?${query}` : "/admin/audit";
}

const fieldClass =
  "rounded-xl border-[1.5px] border-border-subtle bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15";

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const session = await requireAdminPage();
  const params = await searchParams;
  const filters: Filters = {
    actor: params.actor || undefined,
    action: params.action && params.action in AUDIT_LABELS ? params.action : undefined,
    from: params.from && DATE_PATTERN.test(params.from) ? params.from : undefined,
    to: params.to && DATE_PATTERN.test(params.to) ? params.to : undefined,
  };

  const where: Prisma.AuditLogWhereInput = {
    ...(filters.actor ? { actor: filters.actor } : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: istDayStart(filters.from) } : {}),
            ...(filters.to ? { lte: istDayEnd(filters.to) } : {}),
          },
        }
      : {}),
  };
  const filtered = Object.values(filters).some(Boolean);

  const [entries, actors] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE_LIMIT }),
    prisma.auditLog.findMany({ distinct: ["actor"], select: { actor: true }, orderBy: { actor: "asc" } }),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <AdminNav session={session} current="audit" />
      <h1 className="text-2xl font-bold text-ink">Audit log</h1>
      <p className="mb-5 mt-1 text-sm text-muted">
        Every admin sign-in and moderation action, newest first (up to {PAGE_LIMIT} shown).
      </p>

      {actors.length > 1 && (
        <div className="scrollbar-none mb-3 flex gap-2 overflow-x-auto">
          {[{ actor: undefined }, ...actors].map((row) => {
            const active = row.actor === filters.actor;
            return (
              <Link
                key={row.actor ?? "all"}
                href={hrefWith(filters, { actor: row.actor })}
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

      <form
        method="get"
        action="/admin/audit"
        aria-label="Filter the audit log"
        className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-border-subtle bg-card p-4 shadow-card"
      >
        {filters.actor && <input type="hidden" name="actor" value={filters.actor} />}
        <div className="flex flex-col gap-1">
          <label htmlFor="audit-action" className="text-xs font-semibold text-muted">
            Action
          </label>
          <select id="audit-action" name="action" defaultValue={filters.action ?? ""} className={fieldClass}>
            <option value="">All actions</option>
            {(Object.entries(AUDIT_LABELS) as [AuditAction, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="audit-from" className="text-xs font-semibold text-muted">
            From
          </label>
          <input id="audit-from" type="date" name="from" defaultValue={filters.from} className={fieldClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="audit-to" className="text-xs font-semibold text-muted">
            To
          </label>
          <input id="audit-to" type="date" name="to" defaultValue={filters.to} className={fieldClass} />
        </div>
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow-primary transition hover:bg-primary-hover"
        >
          Filter
        </button>
        {filtered && (
          <Link href="/admin/audit" className="px-2 py-2 text-sm font-semibold text-muted hover:text-ink hover:underline">
            Clear filters
          </Link>
        )}
      </form>

      <p data-testid="audit-count" className="mb-2 text-sm text-muted">
        {entries.length === PAGE_LIMIT ? `Latest ${PAGE_LIMIT}` : entries.length}{" "}
        {entries.length === 1 ? "entry" : "entries"}
        {filtered ? " matching these filters" : ""}
      </p>
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
          <li className="px-6 py-12 text-center text-sm text-muted">
            {filtered ? "Nothing matches these filters." : "Nothing recorded yet."}
          </li>
        )}
      </ol>
    </div>
  );
}
