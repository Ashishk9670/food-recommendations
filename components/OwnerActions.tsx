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
    <div className="flex items-center gap-2 text-sm">
      <Link href={`/edit/${id}`} className="font-medium text-orange-600 hover:underline">
        Edit
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
