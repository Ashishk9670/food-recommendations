"use client";

import { Bookmark, BookOpen, NotebookPen, Shield, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLastReviewerName, useOwnedIds, useSavedIds } from "@/lib/localLists";

// The design's profile avatar. There are no user accounts, so this is an
// honest "on this device" menu: posts made from this browser, bookmarks, and
// the reviewer name last used (its initial is the avatar).
export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const name = useLastReviewerName();
  const owned = useOwnedIds().length;
  const saved = useSavedIds().length;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const close = () => setOpen(false);
  const itemClass =
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-card-muted";

  return (
    <div ref={rootRef} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Your activity"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-card-muted text-sm font-bold uppercase text-accent transition hover:border-border-hover"
      >
        {name ? name[0] : <User aria-hidden="true" className="h-[18px] w-[18px] text-muted" />}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-border-subtle bg-card p-2 shadow-float">
          <div className="px-3 pb-2 pt-1.5">
            <p className="text-sm font-bold text-ink">{name ? `Hi, ${name}` : "Your activity"}</p>
            <p className="text-xs text-muted">No account needed — this lives in this browser.</p>
          </div>
          <Link href="/me" onClick={close} className={itemClass}>
            <NotebookPen aria-hidden="true" className="h-4 w-4 text-accent" />
            <span className="flex-1">My recommendations</span>
            <span className="text-xs font-medium text-muted">{owned}</span>
          </Link>
          <Link href="/me#saved" onClick={close} className={itemClass}>
            <Bookmark aria-hidden="true" className="h-4 w-4 text-accent" />
            <span className="flex-1">Saved dishes</span>
            <span className="text-xs font-medium text-muted">{saved}</span>
          </Link>
          <Link href="/guidelines" onClick={close} className={itemClass}>
            <BookOpen aria-hidden="true" className="h-4 w-4 text-accent" />
            Tasting guidelines
          </Link>
          <div className="my-1 border-t border-border-subtle" />
          <Link href="/admin" onClick={close} className={`${itemClass} text-muted`}>
            <Shield aria-hidden="true" className="h-4 w-4" />
            Admin
          </Link>
        </div>
      )}
    </div>
  );
}
