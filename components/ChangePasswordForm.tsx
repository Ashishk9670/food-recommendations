"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded-xl border-[1.5px] border-border-subtle bg-card px-3.5 py-2.5 text-[15px] text-ink placeholder:text-faint transition focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15";

export default function ChangePasswordForm({ minLength }: { minLength: number }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (newPassword !== confirmPassword) {
      setError("The new passwords don't match.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/admin/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Couldn't change your password.");
      return;
    }
    setDone(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md space-y-4 rounded-2xl border border-border-subtle bg-card p-5 shadow-card"
    >
      <div>
        <label htmlFor="current-password" className="mb-1.5 block text-sm font-semibold text-ink">
          Current password
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold text-ink">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={`At least ${minLength} characters`}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-semibold text-ink">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="rounded-xl bg-accent-soft px-4 py-3 text-sm font-medium text-ink">
          Password changed. Other browsers signed in as you have been signed out.
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-primary px-4 py-3 font-semibold text-on-primary shadow-primary transition hover:bg-primary-hover disabled:opacity-50"
      >
        {busy ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}
