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
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-orange-600 text-white shadow-sm"
          : "bg-white text-stone-600 ring-1 ring-orange-100 hover:bg-orange-100"
      }`}
    >
      {children}
    </Link>
  );
}

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
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
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
      </div>
      <div className="flex flex-wrap gap-2">
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
      </div>
      <div className="flex flex-wrap gap-2">
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
      </div>
      <div className="flex flex-wrap gap-2">
        <FilterPill
          href={buildHref(category, minStars, maxPrice, undefined, q)}
          active={!sort || sort === "newest"}
        >
          Newest
        </FilterPill>
        <FilterPill href={buildHref(category, minStars, maxPrice, "liked", q)} active={sort === "liked"}>
          Most liked
        </FilterPill>
        <FilterPill href={buildHref(category, minStars, maxPrice, "rating", q)} active={sort === "rating"}>
          Highest rated
        </FilterPill>
        <FilterPill
          href={buildHref(category, minStars, maxPrice, "trending", q)}
          active={sort === "trending"}
        >
          Trending
        </FilterPill>
      </div>
    </div>
  );
}
