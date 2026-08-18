import Link from "next/link";

export default function Pagination({
  hasNext,
  hasPrevious,
  nextCursor,
  prevCursor,
  category,
  minStars,
  maxPrice,
  sort,
  q,
}: {
  hasNext: boolean;
  hasPrevious: boolean;
  nextCursor?: string;
  prevCursor?: string;
  category?: string;
  minStars?: number;
  maxPrice?: number;
  sort?: string;
  q?: string;
}) {
  if (!hasNext && !hasPrevious) return null;

  function buildHref(direction: "next" | "prev", cursor?: string) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (minStars) params.set("minStars", String(minStars));
    if (maxPrice) params.set("maxPrice", String(maxPrice));
    if (sort && sort !== "newest") params.set("sort", sort);
    if (q) params.set("q", q);
    if (cursor) params.set(direction === "next" ? "after" : "before", cursor);
    const query = params.toString();
    return query ? `/?${query}` : "/";
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      {hasPrevious ? (
        <Link
          href={buildHref("prev", prevCursor)}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-stone-600 ring-1 ring-orange-100 hover:bg-orange-100"
        >
          ← Previous
        </Link>
      ) : (
        <span className="rounded-lg px-4 py-2 text-sm font-medium text-stone-300">← Previous</span>
      )}
      {hasNext ? (
        <Link
          href={buildHref("next", nextCursor)}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-stone-600 ring-1 ring-orange-100 hover:bg-orange-100"
        >
          Next →
        </Link>
      ) : (
        <span className="rounded-lg px-4 py-2 text-sm font-medium text-stone-300">Next →</span>
      )}
    </div>
  );
}
