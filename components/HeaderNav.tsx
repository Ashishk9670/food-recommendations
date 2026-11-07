"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Only real destinations: the mockup's Curated Spots / Top Rated / Team
// Favorites / Leaderboard links have no pages behind them, so they're omitted.
export default function HeaderNav() {
  const pathname = usePathname();
  const onBrowse = pathname === "/" || pathname.startsWith("/recommendation");

  return (
    <nav aria-label="Main" className="hidden md:block">
      <Link
        href="/"
        aria-current={pathname === "/" ? "page" : undefined}
        className={`border-b-2 pb-1 text-sm font-semibold transition-colors ${
          onBrowse ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"
        }`}
      >
        Discover
      </Link>
    </nav>
  );
}
