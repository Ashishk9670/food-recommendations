"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getLastSeen, markSeen } from "@/lib/notificationState";
import { getOwnerTokens } from "@/lib/ownerTokens";

const POLL_MS = 30_000;

type NewItem = { id: number; dishName: string; restaurantName: string; createdAt: string };

export default function NotificationBell() {
  const [unseen, setUnseen] = useState<NewItem[]>([]);
  const [shown, setShown] = useState<NewItem[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/recommendations/new?since=${encodeURIComponent(getLastSeen())}`);
      if (!res.ok) return;
      const { items } = (await res.json()) as { items: NewItem[] };
      // Re-read last-seen *after* the fetch: if the bell was opened while this
      // request was in flight (e.g. a focus-triggered refresh racing a tap),
      // the response would otherwise resurrect items the user just saw.
      const seenAt = new Date(getLastSeen()).getTime();
      // "Someone else submitted" — your own submissions never bump your bell.
      const own = getOwnerTokens();
      setUnseen(
        items.filter((item) => !(item.id in own) && new Date(item.createdAt).getTime() > seenAt),
      );
    } catch {
      // Network blip; the next poll will catch up.
    }
  }, []);

  useEffect(() => {
    // Polling an external system: setState inside refresh only runs after the
    // fetch resolves, never synchronously in this effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const interval = window.setInterval(refresh, POLL_MS);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    function handlePointer(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    // Opening counts as "seen". Mark up to the newest item's own timestamp
    // (not "now"), so anything created between the last poll and this click
    // still shows up as new on the next poll instead of being skipped.
    if (unseen.length > 0) markSeen(unseen[0].createdAt);
    setShown(unseen);
    setUnseen([]);
    setOpen(true);
  }

  const count = unseen.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={count > 0 ? `Notifications, ${count} new` : "Notifications"}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-lg text-white transition-colors hover:bg-white/25"
      >
        <span aria-hidden="true">🔔</span>
        {count > 0 && (
          <span
            data-testid="notification-count"
            className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold leading-none text-white ring-2 ring-white"
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        // On phones the bell isn't flush right ("+ Submit" sits beside it), so a
        // right-anchored 18rem panel would hang off the left edge — pin it to
        // the viewport there instead, and anchor it to the bell from sm up.
        <div className="fixed inset-x-4 top-16 z-50 overflow-hidden rounded-xl border border-orange-100 bg-white shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-72 dark:border-stone-800 dark:bg-stone-900">
          <p className="border-b border-orange-100 px-4 py-2.5 text-sm font-semibold text-stone-900 dark:border-stone-800 dark:text-stone-100">
            New recommendations
          </p>
          {shown.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-stone-500 dark:text-stone-400">
              Nothing new since you last checked.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {shown.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/recommendation/${item.id}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 hover:bg-orange-50 dark:hover:bg-stone-800"
                  >
                    <span className="block truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                      {item.dishName}
                    </span>
                    <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
                      at {item.restaurantName}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
