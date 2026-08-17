import Link from "next/link";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import RecommendationCard from "@/components/RecommendationCard";
import { CATEGORIES } from "@/lib/categories";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

type HomeProps = {
  searchParams: Promise<{
    category?: string;
    minStars?: string;
    maxPrice?: string;
    sort?: string;
    q?: string;
    page?: string;
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
  const sort = params.sort === "liked" || params.sort === "rating" ? params.sort : undefined;
  const q = params.q?.trim() || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const where = {
    ...(category ? { category } : {}),
    ...(minStars ? { rating: { gte: minStars } } : {}),
    ...(maxPrice ? { price: { lte: maxPrice } } : {}),
    ...(q ? { OR: [{ dishName: { contains: q } }, { restaurantName: { contains: q } }] } : {}),
  };

  const orderBy =
    sort === "liked"
      ? [{ likeCount: "desc" as const }, { createdAt: "desc" as const }]
      : sort === "rating"
        ? [{ rating: "desc" as const }, { createdAt: "desc" as const }]
        : { createdAt: "desc" as const };

  const [recommendations, totalCount] = await Promise.all([
    prisma.recommendation.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.recommendation.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
          {sort && <input type="hidden" name="sort" value={sort} />}
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
                imageUrl={rec.imageUrl}
                likeCount={rec.likeCount}
                restaurantName={rec.restaurantName}
                reviewerName={rec.reviewerName}
                notes={rec.notes}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
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
