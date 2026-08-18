import Link from "next/link";
import type { Prisma } from "@/app/generated/prisma/client";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import RecommendationCard from "@/components/RecommendationCard";
import { CATEGORIES } from "@/lib/categories";
import { findMatchingRecommendationIds, getRecommendationsPage } from "@/lib/recommendations";
import {
  PAGE_SIZE,
  buildSeekWhere,
  cursorFromRow,
  decodeCursor,
  encodeCursor,
  getOrderBy,
  reverseOrderBy,
  startOfIsoWeek,
  type SortMode,
} from "@/lib/pagination";

type HomeProps = {
  searchParams: Promise<{
    category?: string;
    minStars?: string;
    maxPrice?: string;
    sort?: string;
    q?: string;
    after?: string;
    before?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const category =
    params.category && CATEGORIES.includes(params.category as (typeof CATEGORIES)[number])
      ? params.category
      : undefined;
  const minStars = params.minStars ? Number(params.minStars) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const sort: SortMode =
    params.sort === "liked" || params.sort === "rating" || params.sort === "trending"
      ? params.sort
      : "newest";
  const q = params.q?.trim() || undefined;

  const afterCursor = decodeCursor(params.after);
  const beforeCursor = decodeCursor(params.before);
  const cursor = beforeCursor ?? afterCursor;
  const wantAfter = !beforeCursor && !!afterCursor;

  const andConditions: Prisma.RecommendationWhereInput[] = [];
  if (category) andConditions.push({ category });
  if (minStars) andConditions.push({ rating: { gte: minStars } });
  if (maxPrice) andConditions.push({ price: { lte: maxPrice } });
  if (sort === "trending") andConditions.push({ createdAt: { gte: startOfIsoWeek() } });
  if (q) {
    const matchingIds = await findMatchingRecommendationIds(q);
    andConditions.push({ id: { in: matchingIds } });
  }
  if (cursor) andConditions.push(buildSeekWhere(sort, cursor, wantAfter));

  const where: Prisma.RecommendationWhereInput = andConditions.length ? { AND: andConditions } : {};
  const baseOrderBy = getOrderBy(sort);
  const orderBy = beforeCursor ? reverseOrderBy(baseOrderBy) : baseOrderBy;

  const rows = await getRecommendationsPage(where, orderBy, PAGE_SIZE + 1);
  const hasMore = rows.length > PAGE_SIZE;
  const pageRows = rows.slice(0, PAGE_SIZE);
  const recommendations = beforeCursor ? pageRows.slice().reverse() : pageRows;

  const hasNext = beforeCursor ? true : hasMore;
  const hasPrevious = beforeCursor ? hasMore : Boolean(afterCursor);
  const firstRow = recommendations[0];
  const lastRow = recommendations[recommendations.length - 1];
  const prevCursor = firstRow ? encodeCursor(cursorFromRow(firstRow)) : undefined;
  const nextCursor = lastRow ? encodeCursor(cursorFromRow(lastRow)) : undefined;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 space-y-4">
        <h1 className="text-2xl font-bold text-stone-900">
          Browse Recommendations
        </h1>
        <form action="/" method="get" className="flex gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          {minStars && <input type="hidden" name="minStars" value={minStars} />}
          {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
          {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by dish or restaurant..."
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          />
          <button
            type="submit"
            className="flex-shrink-0 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Search
          </button>
        </form>
        <FilterBar category={category} minStars={minStars} maxPrice={maxPrice} sort={sort} q={q} />
      </div>

      {recommendations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-white/60 py-16 text-center text-stone-500">
          <p className="mb-3">No recommendations match these filters yet.</p>
          <Link href="/submit" className="font-medium text-orange-600 underline">
            Be the first to submit one
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                id={rec.id}
                dishName={rec.dishName}
                category={rec.category}
                rating={rec.rating}
                price={rec.price}
                primaryPhotoUrl={rec.photos[0]?.url ?? ""}
                likeCount={rec.likeCount}
                restaurantName={rec.restaurantName}
                reviewerName={rec.reviewerName}
                notes={rec.notes}
              />
            ))}
          </div>
          <Pagination
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            nextCursor={nextCursor}
            prevCursor={prevCursor}
            category={category}
            minStars={minStars}
            maxPrice={maxPrice}
            sort={sort}
            q={q}
          />
        </>
      )}
    </div>
  );
}
