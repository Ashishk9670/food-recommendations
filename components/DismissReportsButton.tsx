"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DismissReportsButton({ id }: { id: number }) {
  const router = useRouter();
  const [dismissing, setDismissing] = useState(false);

  async function handleDismiss() {
    if (!confirm("Dismiss all reports on this recommendation? It will stay live.")) return;

    setDismissing(true);
    const res = await fetch(`/api/admin/recommendations/${id}/dismiss-reports`, {
      method: "POST",
    });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to dismiss reports. Please try again.");
      setDismissing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDismiss}
      disabled={dismissing}
      className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {dismissing ? "Dismissing..." : "Dismiss reports"}
    </button>
  );
}
