import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

const STAR_FILTERS = [4, 3, 2, 1];

function buildHref(category?: string, minStars?: number) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (minStars) params.set("minStars", String(minStars));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {children}
    </Link>
  );
}

export default function FilterBar({
  category,
  minStars,
}: {
  category?: string;
  minStars?: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <FilterPill href={buildHref(undefined, minStars)} active={!category}>
          All categories
        </FilterPill>
        {CATEGORIES.map((cat) => (
          <FilterPill
            key={cat}
            href={buildHref(cat, minStars)}
            active={category === cat}
          >
            {cat}
          </FilterPill>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <FilterPill href={buildHref(category, undefined)} active={!minStars}>
          All ratings
        </FilterPill>
        {STAR_FILTERS.map((stars) => (
          <FilterPill
            key={stars}
            href={buildHref(category, stars)}
            active={minStars === stars}
          >
            {stars}★ &amp; up
          </FilterPill>
        ))}
      </div>
    </div>
  );
}
