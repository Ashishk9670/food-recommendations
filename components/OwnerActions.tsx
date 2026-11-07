"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOwnerToken } from "@/lib/ownerTokens";

export default function OwnerActions({ id }: { id: number }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // localStorage is unavailable during SSR, so this can't be a lazy useState
    // initializer without causing a hydration mismatch — it has to run after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(getOwnerToken(id) ?? null);
  }, [id]);

  if (!token) return null;

  async function handleDelete() {
    if (!confirm("Delete your recommendation? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/recommendations/${id}`, {
      method: "DELETE",
      headers: { "x-edit-token": token as string },
    });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to delete. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-1 text-xs font-semibold">
      <Link
        href={`/edit/${id}`}
        className="rounded-full px-2.5 py-1 text-accent transition-colors hover:bg-accent-soft"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-full px-2.5 py-1 text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
