import Link from "next/link";
import FilterBar from "@/components/FilterBar";
import RecommendationCard from "@/components/RecommendationCard";
import { CATEGORIES } from "@/lib/categories";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ category?: string; minStars?: string; maxPrice?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const category =
    params.category && CATEGORIES.includes(params.category as (typeof CATEGORIES)[number])
      ? params.category
      : undefined;
  const minStars = params.minStars ? Number(params.minStars) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;

  const recommendations = await prisma.recommendation.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(minStars ? { rating: { gte: minStars } } : {}),
      ...(maxPrice ? { price: { lte: maxPrice } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Browse Recommendations
        </h1>
        <FilterBar category={category} minStars={minStars} maxPrice={maxPrice} />
      </div>

      {recommendations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-gray-500">
          <p className="mb-3">No recommendations match these filters yet.</p>
          <Link href="/submit" className="font-medium text-gray-900 underline">
            Be the first to submit one
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              dishName={rec.dishName}
              category={rec.category}
              rating={rec.rating}
              price={rec.price}
              imageUrl={rec.imageUrl}
              restaurantName={rec.restaurantName}
              reviewerName={rec.reviewerName}
              notes={rec.notes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
