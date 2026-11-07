"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "w-full rounded-xl border-[1.5px] border-border-subtle bg-card px-3.5 py-2.5 text-[15px] text-ink placeholder:text-faint transition focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Incorrect password.");
      setSubmitting(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto min-h-[70vh] w-full max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold text-ink">Admin Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="admin-username" className="mb-1.5 block text-sm font-semibold text-ink">
            Username
          </label>
          <input
            id="admin-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            aria-describedby="admin-username-hint"
            className={inputClass}
          />
          <p id="admin-username-hint" className="mt-1 text-xs text-muted">
            Leave blank to sign in as the owner.
          </p>
        </div>
        <div>
          <label htmlFor="admin-password" className="mb-1.5 block text-sm font-semibold text-ink">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            className={inputClass}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-primary px-4 py-3 font-semibold text-on-primary shadow-primary transition hover:bg-primary-hover disabled:opacity-50"
        >
          {submitting ? "Checking..." : "Log In"}
        </button>
      </form>
    </div>
  );
}
