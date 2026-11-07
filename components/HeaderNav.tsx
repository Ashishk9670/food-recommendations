"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useOwnedIds, useSavedIds } from "@/lib/localLists";

export const NAV_ITEMS = [
  { key: "discover", href: "/", label: "Discover" },
  { key: "spots", href: "/restaurants", label: "Curated Spots" },
  { key: "top", href: "/?sort=rating", label: "Top Rated Dishes" },
  { key: "favorites", href: "/?sort=liked", label: "Team Favorites" },
  { key: "leaderboard", href: "/leaderboard", label: "Leaderboard" },
] as const;

type NavKey = (typeof NAV_ITEMS)[number]["key"];

function useActiveKey(): NavKey | null {
  const pathname = usePathname();
  const sort = useSearchParams().get("sort");
  if (pathname === "/") {
    if (sort === "rating") return "top";
    if (sort === "liked") return "favorites";
    return "discover";
  }
  if (pathname.startsWith("/recommendation")) return "discover";
  if (pathname.startsWith("/restaurants")) return "spots";
  if (pathname.startsWith("/leaderboard")) return "leaderboard";
  return null;
}

// Desktop: inline links. Rendered inside <Suspense> in the layout because it
// reads search params.
export default function HeaderNav() {
  const active = useActiveKey();
  return (
    <nav aria-label="Main" className="hidden items-center gap-5 lg:flex">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={active === item.key ? "page" : undefined}
          className={`whitespace-nowrap border-b-2 pb-1 pt-1.5 text-sm font-semibold transition-colors ${
            active === item.key
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

// Static fallback while search params resolve: same links, nothing marked active.
export function HeaderNavFallback() {
  return (
    <nav aria-label="Main" className="hidden items-center gap-5 lg:flex">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className="whitespace-nowrap border-b-2 border-transparent pb-1 pt-1.5 text-sm font-semibold text-muted hover:text-ink"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

// Phones and tablets: the same links plus the "on this device" shortcuts,
// behind a menu button.
export function MobileMenu() {
  const active = useActiveKey();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
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
  const itemClass = (isActive: boolean) =>
    `flex items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-semibold ${
      isActive ? "bg-accent-soft text-accent" : "text-ink hover:bg-card-muted"
    }`;

  return (
    <div ref={rootRef} className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-card-muted"
      >
        {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
      </button>
      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-4 top-[4.5rem] z-50 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border border-border-subtle bg-card p-2 shadow-float sm:left-auto sm:right-8 sm:w-80"
        >
          <nav aria-label="Main">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={close}
                aria-current={active === item.key ? "page" : undefined}
                className={itemClass(active === item.key)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="my-2 border-t border-border-subtle" />
          <p className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-faint">
            On this device
          </p>
          <Link href="/me" onClick={close} className={itemClass(false)}>
            My recommendations <span className="text-sm font-medium text-muted">{owned}</span>
          </Link>
          <Link href="/me#saved" onClick={close} className={itemClass(false)}>
            Saved dishes <span className="text-sm font-medium text-muted">{saved}</span>
          </Link>
          <Link href="/guidelines" onClick={close} className={itemClass(false)}>
            Tasting guidelines
          </Link>
        </div>
      )}
    </div>
  );
}
