import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

const STAR_FILTERS = [4, 3, 2, 1];
const PRICE_FILTERS = [200, 500, 1000];

function buildHref(
  category?: string,
  minStars?: number,
  maxPrice?: number,
  sort?: string,
  q?: string,
) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (minStars) params.set("minStars", String(minStars));
  if (maxPrice) params.set("maxPrice", String(maxPrice));
  if (sort && sort !== "newest") params.set("sort", sort);
  if (q) params.set("q", q);
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
      aria-current={active ? "true" : undefined}
      className={`flex-shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
        active
          ? "bg-primary text-on-primary shadow-primary"
          : "border border-border-subtle bg-card text-ink hover:border-border-hover hover:bg-card-muted"
      }`}
    >
      {children}
    </Link>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-20 flex-shrink-0 text-[11px] font-bold uppercase tracking-[0.1em] text-faint">
        {label}
      </span>
      {/* Scrolls sideways on phones rather than wrapping into a tall block. */}
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {children}
      </div>
    </div>
  );
}

const SORTS = [
  { value: undefined, label: "Newest" },
  { value: "liked", label: "Most liked" },
  { value: "rating", label: "Highest rated" },
  { value: "trending", label: "Trending" },
] as const;

export default function FilterBar({
  category,
  minStars,
  maxPrice,
  sort,
  q,
}: {
  category?: string;
  minStars?: number;
  maxPrice?: number;
  sort?: string;
  q?: string;
}) {
  const activeSort = sort ?? "newest";

  return (
    <div className="flex flex-col gap-3">
      <FilterRow label="Category">
        <FilterPill href={buildHref(undefined, minStars, maxPrice, sort, q)} active={!category}>
          All categories
        </FilterPill>
        {CATEGORIES.map((cat) => (
          <FilterPill
            key={cat}
            href={buildHref(cat, minStars, maxPrice, sort, q)}
            active={category === cat}
          >
            {cat}
          </FilterPill>
        ))}
      </FilterRow>

      <FilterRow label="Rating">
        <FilterPill href={buildHref(category, undefined, maxPrice, sort, q)} active={!minStars}>
          All ratings
        </FilterPill>
        {STAR_FILTERS.map((stars) => (
          <FilterPill
            key={stars}
            href={buildHref(category, stars, maxPrice, sort, q)}
            active={minStars === stars}
          >
            {stars}★ &amp; up
          </FilterPill>
        ))}
      </FilterRow>

      <div className="flex flex-col gap-3 border-t border-border-subtle pt-3 xl:flex-row xl:items-center xl:justify-between">
        <FilterRow label="Budget">
          <FilterPill href={buildHref(category, minStars, undefined, sort, q)} active={!maxPrice}>
            All prices
          </FilterPill>
          {PRICE_FILTERS.map((price) => (
            <FilterPill
              key={price}
              href={buildHref(category, minStars, price, sort, q)}
              active={maxPrice === price}
            >
              Under ₹{price}
            </FilterPill>
          ))}
        </FilterRow>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-faint">Sort</span>
          <div className="scrollbar-none flex items-center gap-1 overflow-x-auto text-[13px]">
            {SORTS.map((s, i) => {
              const active = activeSort === (s.value ?? "newest");
              return (
                <span key={s.label} className="flex flex-shrink-0 items-center gap-1">
                  {i > 0 && (
                    <span aria-hidden="true" className="text-border-hover">
                      /
                    </span>
                  )}
                  <Link
                    href={buildHref(category, minStars, maxPrice, s.value, q)}
                    aria-current={active ? "true" : undefined}
                    className={`whitespace-nowrap rounded-full px-2 py-1 transition-colors ${
                      active ? "font-bold text-accent" : "font-medium text-muted hover:text-ink"
                    }`}
                  >
                    {s.label}
                  </Link>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
