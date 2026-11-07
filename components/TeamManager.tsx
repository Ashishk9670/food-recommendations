"use client";

import { KeyRound, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Admin = {
  id: number;
  username: string;
  createdBy: string;
  createdAt: string;
  activeSessions: number;
};

const inputClass =
  "w-full rounded-xl border-[1.5px] border-border-subtle bg-card px-3.5 py-2.5 text-[15px] text-ink placeholder:text-faint transition focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15";

async function readError(res: Response, fallback: string) {
  const body = await res.json().catch(() => null);
  return body?.error ?? fallback;
}

export default function TeamManager({
  admins,
  minPasswordLength,
}: {
  admins: Admin[];
  minPasswordLength: number;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(await readError(res, "Couldn't add that admin."));
      return;
    }
    setNotice(`Added ${username.trim().toLowerCase()}. Share the password with them privately.`);
    setUsername("");
    setPassword("");
    router.refresh();
  }

  async function handleRemove(admin: Admin) {
    if (!confirm(`Remove ${admin.username}? They'll be signed out straight away.`)) return;
    setError(null);
    setNotice(null);
    const res = await fetch(`/api/admin/team/${admin.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError(await readError(res, "Couldn't remove that admin."));
      return;
    }
    setNotice(`Removed ${admin.username}.`);
    router.refresh();
  }

  async function handleReset(admin: Admin) {
    const next = prompt(
      `New password for ${admin.username} (at least ${minPasswordLength} characters). Their current sessions will end.`,
    );
    if (!next) return;
    setError(null);
    setNotice(null);
    const res = await fetch(`/api/admin/team/${admin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: next }),
    });
    if (!res.ok) {
      setError(await readError(res, "Couldn't reset that password."));
      return;
    }
    setNotice(`Password reset for ${admin.username}.`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="grid gap-3 rounded-2xl border border-border-subtle bg-card p-5 shadow-card sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div>
          <label htmlFor="new-admin-username" className="mb-1.5 block text-sm font-semibold text-ink">
            Username
          </label>
          <input
            id="new-admin-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            placeholder="e.g. priya.s"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="new-admin-password" className="mb-1.5 block text-sm font-semibold text-ink">
            Password
          </label>
          <input
            id="new-admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder={`At least ${minPasswordLength} characters`}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-primary transition hover:bg-primary-hover disabled:opacity-50"
        >
          <UserPlus aria-hidden="true" className="h-4 w-4" />
          {busy ? "Adding..." : "Add admin"}
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl bg-accent-soft px-4 py-3 text-sm font-medium text-ink">
          {notice}
        </p>
      )}

      <ul className="space-y-3">
        {admins.map((admin) => (
          <li
            key={admin.id}
            data-testid="team-row"
            className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft font-bold uppercase text-accent"
              >
                {admin.username[0]}
              </span>
              <div>
                <p className="font-semibold text-ink">{admin.username}</p>
                <p className="text-xs text-muted">
                  Added by {admin.createdBy} on{" "}
                  {new Date(admin.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} ·{" "}
                  {admin.activeSessions} active session{admin.activeSessions === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleReset(admin)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-3.5 py-1.5 text-sm font-semibold text-ink transition hover:bg-card-muted"
              >
                <KeyRound aria-hidden="true" className="h-4 w-4" />
                Reset password
              </button>
              <button
                type="button"
                onClick={() => handleRemove(admin)}
                aria-label={`Remove ${admin.username}`}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold text-danger transition hover:bg-danger-soft"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Remove
              </button>
            </div>
          </li>
        ))}
        {admins.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border-hover px-6 py-10 text-center text-sm text-muted">
            No other admins yet. Add a teammate above to share moderation.
          </li>
        )}
      </ul>
    </div>
  );
}
