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
    <div className="mt-10 flex items-center justify-center gap-3">
      {hasPrevious ? (
        <Link
          href={buildHref("prev", prevCursor)}
          className="rounded-full border-[1.5px] border-border-subtle bg-card px-5 py-2 text-sm font-semibold text-ink shadow-card transition hover:border-border-hover hover:bg-card-muted"
        >
          ← Previous
        </Link>
      ) : (
        <span aria-disabled="true" className="rounded-full px-5 py-2 text-sm font-semibold text-faint">← Previous</span>
      )}
      {hasNext ? (
        <Link
          href={buildHref("next", nextCursor)}
          className="rounded-full border-[1.5px] border-border-subtle bg-card px-5 py-2 text-sm font-semibold text-ink shadow-card transition hover:border-border-hover hover:bg-card-muted"
        >
          Next →
        </Link>
      ) : (
        <span aria-disabled="true" className="rounded-full px-5 py-2 text-sm font-semibold text-faint">Next →</span>
      )}
    </div>
  );
}
