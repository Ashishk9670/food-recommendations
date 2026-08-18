"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteRecommendationButton({ id }: { id: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this recommendation? This cannot be undone.")) return;

    setDeleting(true);
    const res = await fetch(`/api/recommendations/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to delete. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-red-700"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}
