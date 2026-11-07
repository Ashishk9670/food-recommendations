import { Heart, MapPin, Store, Star, UtensilsCrossed } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import { IMAGE_BLUR_DATA_URL } from "@/lib/imagePlaceholder";
import { OFFICE_HUB } from "@/lib/ratings";
import { getRestaurants, sortRestaurants, type RestaurantSort } from "@/lib/restaurants";

export const metadata: Metadata = {
  title: "Curated Spots · Food Recommendations",
  description: "Every place colleagues have recommended, with their best dishes and average rating.",
};

const SORTS: { value: RestaurantSort; label: string }[] = [
  { value: "dishes", label: "Most dishes" },
  { value: "rating", label: "Highest rated" },
  { value: "liked", label: "Most liked" },
];

function priceRange(min: number, max: number) {
  return min === max ? `₹${min}` : `₹${min}–${max}`;
}

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: sortParam } = await searchParams;
  const sort: RestaurantSort = sortParam === "rating" || sortParam === "liked" ? sortParam : "dishes";
  const restaurants = sortRestaurants(await getRestaurants(), sort);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <section className="mb-8 max-w-2xl">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
          {OFFICE_HUB}
        </p>
        <h1 className="text-[30px] font-extrabold leading-[38px] tracking-tight text-ink sm:text-[40px] sm:leading-[48px]">
          Curated Spots
        </h1>
        <p className="mt-2 text-base leading-6 text-muted">
          Every place colleagues have recommended — {restaurants.length}{" "}
          {restaurants.length === 1 ? "spot" : "spots"} so far, with their best dishes and how they
          rate.
        </p>
      </section>

      <nav aria-label="Sort spots" className="mb-6 flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
        <span className="mr-2 text-[11px] font-bold uppercase tracking-[0.1em] text-faint">Sort</span>
        {SORTS.map((option, index) => (
          <span key={option.value} className="flex items-center gap-1">
            {index > 0 && <span aria-hidden="true" className="text-faint">/</span>}
            <Link
              href={option.value === "dishes" ? "/restaurants" : `/restaurants?sort=${option.value}`}
              aria-current={sort === option.value ? "true" : undefined}
              className={`rounded px-1 font-semibold ${
                sort === option.value ? "text-accent underline underline-offset-4" : "text-muted hover:text-ink"
              }`}
            >
              {option.label}
            </Link>
          </span>
        ))}
      </nav>

      {restaurants.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-hover bg-card px-6 py-16 text-center">
          <Store aria-hidden="true" className="mb-3 h-8 w-8 text-accent" />
          <p className="mb-4 text-lg font-bold text-ink">No spots yet.</p>
          <Link href="/submit" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary">
            Recommend the first dish
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((spot, index) => (
            <li key={spot.slug}>
              <Link
                href={`/restaurants/${spot.slug}`}
                data-testid="restaurant-card"
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-card shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-border-hover hover:shadow-card-hover"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-card-muted">
                  {spot.coverUrl ? (
                    <Image
                      src={spot.coverUrl}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      placeholder="blur"
                      blurDataURL={IMAGE_BLUR_DATA_URL}
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-faint">
                      <UtensilsCrossed aria-hidden="true" className="h-10 w-10" strokeWidth={1.5} />
                    </div>
                  )}
                  <span className="absolute right-3 top-3 rounded-full bg-card shadow-sm">
                    <CategoryBadge category={spot.topCategory} />
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h2 className="text-[17px] font-bold leading-6 tracking-tight text-ink group-hover:text-accent">
                    {spot.name}
                  </h2>
                  <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-border-subtle pt-3 text-center">
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-faint">Dishes</dt>
                      <dd className="font-bold text-ink">{spot.dishCount}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-faint">Avg rating</dt>
                      <dd className="inline-flex items-center gap-1 font-bold text-ink">
                        <Star aria-hidden="true" className="h-3.5 w-3.5 fill-star text-star" />
                        {spot.avgRating.toFixed(1)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-faint">Price</dt>
                      <dd className="whitespace-nowrap font-bold text-price">{priceRange(spot.minPrice, spot.maxPrice)}</dd>
                    </div>
                  </dl>
                  {spot.totalLikes > 0 && (
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <Heart aria-hidden="true" className="h-3.5 w-3.5 text-secondary" />
                      {spot.totalLikes} {spot.totalLikes === 1 ? "like" : "likes"} across its dishes
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
