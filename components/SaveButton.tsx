"use client";

import { Bookmark } from "lucide-react";
import { toggleSaved, useSavedIds } from "@/lib/localLists";

export default function SaveButton({ id, size = "sm" }: { id: number; size?: "sm" | "lg" }) {
  const saved = useSavedIds().includes(id);
  const icon = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={() => toggleSaved(id)}
      aria-pressed={saved}
      aria-label={saved ? "Saved" : "Save"}
      title={saved ? "Saved on this device — tap to remove" : "Save for later (on this device)"}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
        saved ? "text-accent" : "text-faint hover:bg-card-muted hover:text-ink"
      }`}
    >
      <Bookmark aria-hidden="true" className={`${icon} ${saved ? "fill-current" : ""}`} />
    </button>
  );
}
