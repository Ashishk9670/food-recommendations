import { ArrowLeft, Heart, MapPin, Plus, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryBadge from "@/components/CategoryBadge";
import RecommendationCard from "@/components/RecommendationCard";
import { getRestaurantDishes } from "@/lib/restaurants";
import { canonicalName } from "@/lib/slug";

type PageProps = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const dishes = await getRestaurantDishes(slug);
  if (dishes.length === 0) return null;
  const name = canonicalName(
    [...dishes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((d) => d.restaurantName),
  );
  const prices = dishes.map((d) => d.price);
  const avgRating = dishes.reduce((sum, d) => sum + d.rating, 0) / dishes.length;
  const totalLikes = dishes.reduce((sum, d) => sum + d.likeCount, 0);
  const categories = [...new Set(dishes.map((d) => d.category))];
  return { name, dishes, minPrice: Math.min(...prices), maxPrice: Math.max(...prices), avgRating, totalLikes, categories };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await load((await params).slug);
  if (!data) return { title: "Spot not found · Food Recommendations" };
  return {
    title: `${data.name} · Food Recommendations`,
    description: `${data.dishes.length} dishes recommended by colleagues at ${data.name}, rated ${data.avgRating.toFixed(1)} on average.`,
  };
}

export default async function RestaurantPage({ params }: PageProps) {
  const data = await load((await params).slug);
  if (!data) notFound();
  const { name, dishes, minPrice, maxPrice, avgRating, totalLikes, categories } = data;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <Link
        href="/restaurants"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        All curated spots
      </Link>

      <section className="mb-8 flex flex-col gap-6 rounded-2xl border border-border-subtle bg-card p-6 shadow-card lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
            Curated spot
          </p>
          <h1 className="text-[28px] font-extrabold leading-9 tracking-tight text-ink sm:text-[36px] sm:leading-[44px]">
            {name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <CategoryBadge key={category} category={category} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <dl className="flex divide-x divide-border-subtle rounded-2xl border border-border-subtle bg-card-muted py-3">
            <div className="px-4">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-faint">Dishes</dt>
              <dd data-testid="restaurant-dish-count" className="text-lg font-bold text-ink">
                {dishes.length}
              </dd>
            </div>
            <div className="px-4">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-faint">Avg rating</dt>
              <dd className="inline-flex items-center gap-1 text-lg font-bold text-ink">
                <Star aria-hidden="true" className="h-4 w-4 fill-star text-star" />
                {avgRating.toFixed(1)}
              </dd>
            </div>
            <div className="px-4">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-faint">Price</dt>
              <dd className="text-lg font-bold text-price">
                {minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice}–${maxPrice}`}
              </dd>
            </div>
            <div className="px-4">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-faint">Likes</dt>
              <dd className="inline-flex items-center gap-1 text-lg font-bold text-ink">
                <Heart aria-hidden="true" className="h-4 w-4 text-secondary" />
                {totalLikes}
              </dd>
            </div>
          </dl>
          <Link
            href={`/submit?restaurant=${encodeURIComponent(name)}`}
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-primary transition hover:bg-primary-hover"
          >
            <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
            Recommend a dish here
          </Link>
        </div>
      </section>

      <h2 className="mb-4 text-lg font-bold text-ink">
        {dishes.length === 1 ? "The dish" : "Dishes, best rated first"}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {dishes.map((rec, index) => (
          <RecommendationCard
            key={rec.id}
            index={index}
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
    </div>
  );
}
