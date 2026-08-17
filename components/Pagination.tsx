import Link from "next/link";

export default function Pagination({
  page,
  totalPages,
  category,
  minStars,
  maxPrice,
  sort,
  q,
}: {
  page: number;
  totalPages: number;
  category?: string;
  minStars?: number;
  maxPrice?: number;
  sort?: string;
  q?: string;
}) {
  if (totalPages <= 1) return null;

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (minStars) params.set("minStars", String(minStars));
    if (maxPrice) params.set("maxPrice", String(maxPrice));
    if (sort) params.set("sort", sort);
    if (q) params.set("q", q);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/?${query}` : "/";
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-stone-600 ring-1 ring-orange-100 hover:bg-orange-100"
        >
          ← Previous
        </Link>
      ) : (
        <span className="rounded-lg px-4 py-2 text-sm font-medium text-stone-300">← Previous</span>
      )}
      <span className="text-sm text-stone-500">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={buildHref(page + 1)}
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
