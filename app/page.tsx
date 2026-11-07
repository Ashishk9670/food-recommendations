import { Flame, Plus, Search, ShieldCheck, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@/app/generated/prisma/client";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import RecommendationCard from "@/components/RecommendationCard";
import { CATEGORIES } from "@/lib/categories";
import {
  findMatchingRecommendationIds,
  getBrowseStats,
  getRecommendationsPage,
} from "@/lib/recommendations";
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

  const [rows, stats] = await Promise.all([
    getRecommendationsPage(where, orderBy, PAGE_SIZE + 1),
    getBrowseStats(),
  ]);
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
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <section className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent">
            <Flame aria-hidden="true" className="h-3.5 w-3.5" />
            Community gastronomy · Triomics
          </p>
          <h1 className="text-[30px] font-extrabold leading-[38px] tracking-tight text-ink sm:text-[40px] sm:leading-[48px]">
            Browse Recommendations
          </h1>
          <p className="mt-2 text-base leading-6 text-muted">
            Peer-reviewed dishes, local secret spots and honest lunchtime cravings — tested and
            approved by Triomics colleagues.
          </p>
        </div>
        {stats.total > 0 && (
          <dl className="flex w-fit divide-x divide-border-subtle rounded-2xl border border-border-subtle bg-card px-1 py-3 shadow-card">
            <div className="px-5">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-faint">Curated</dt>
              <dd data-testid="stat-total" className="text-xl font-bold tracking-tight text-ink">
                {stats.total} {stats.total === 1 ? "dish" : "dishes"}
              </dd>
            </div>
            {stats.topCategory && (
              <div className="px-5">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-faint">
                  Top cuisine
                </dt>
                <dd data-testid="stat-top-cuisine" className="text-xl font-bold tracking-tight text-accent">
                  {stats.topCategory}
                </dd>
              </div>
            )}
          </dl>
        )}
      </section>

      <section className="mb-10 rounded-2xl border border-border-subtle bg-card p-4 shadow-card sm:p-5">
        <form action="/" method="get" role="search" className="relative mb-4">
          {category && <input type="hidden" name="category" value={category} />}
          {minStars && <input type="hidden" name="minStars" value={minStars} />}
          {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
          {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-faint"
          />
          <input
            type="text"
            name="q"
            defaultValue={q}
            aria-label="Search by dish or restaurant"
            placeholder="Search by dish or restaurant..."
            className="h-12 w-full rounded-full border-[1.5px] border-border-subtle bg-card-muted pl-12 pr-28 text-[15px] text-ink placeholder:text-faint focus:border-accent focus:bg-card focus:outline-none focus:ring-4 focus:ring-accent/15"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow-primary transition hover:bg-primary-hover"
          >
            Search
          </button>
        </form>
        <FilterBar category={category} minStars={minStars} maxPrice={maxPrice} sort={sort} q={q} />
      </section>

      {recommendations.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-hover bg-card px-6 py-16 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <UtensilsCrossed aria-hidden="true" className="h-6 w-6" />
          </span>
          <p className="mb-1 text-lg font-bold text-ink">No recommendations match these filters yet.</p>
          <p className="mb-5 text-sm text-muted">Try widening the filters, or add the first one.</p>
          <Link
            href="/submit"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-primary transition hover:bg-primary-hover"
          >
            Be the first to submit one
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            {/* Closing call-to-action, only on the last page so a full page of
                12 cards is never pushed into an orphaned 13th slot. */}
            {!hasNext && (
              <aside className="relative flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-card-muted p-6">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <UtensilsCrossed aria-hidden="true" className="h-5 w-5" />
                </span>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                  Triomics collective
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">
                  Tried something memorable today?
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Help your team skip the lunch guesswork. Add that unbeatable curry, roll or
                  late-night dessert in a couple of minutes.
                </p>
                <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-accent-soft/60" />
                <Link
                  href="/submit"
                  className="relative mt-auto inline-flex items-center justify-center gap-1.5 self-stretch rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-primary transition hover:-translate-y-px hover:bg-primary-hover sm:mt-8"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
                  Add your recommendation
                </Link>
              </aside>
            )}
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

      <section className="mt-14 flex flex-col gap-3 rounded-2xl border border-border-subtle bg-card px-6 py-5 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <ShieldCheck aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <p className="font-bold text-ink">Genuine peer recommendations</p>
          <p className="text-sm text-muted">
            No sponsored listings — every dish here was ordered, eaten and rated by a colleague.
          </p>
        </div>
      </section>
    </div>
  );
}
