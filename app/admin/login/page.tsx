"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
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
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setError("Incorrect password.");
      setSubmitting(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto min-h-[70vh] max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Admin Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-600 focus:outline-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-slate-800 px-4 py-2.5 font-medium text-white transition-colors hover:bg-slate-900 disabled:opacity-50"
        >
          {submitting ? "Checking..." : "Log In"}
        </button>
      </form>
    </div>
  );
}
