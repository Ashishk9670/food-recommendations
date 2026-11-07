import { Heart, Medal, Star, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import { getCommunityStats, getMostLikedDishes, getReviewerLeaderboard } from "@/lib/community";
import { getRestaurants, sortRestaurants } from "@/lib/restaurants";

export const metadata: Metadata = {
  title: "Leaderboard · Food Recommendations",
  description: "Top recommenders, most-liked dishes and best-rated spots at Triomics.",
};

const MEDAL = ["text-star", "text-faint", "text-tag-biryani-fg"];

export default async function LeaderboardPage() {
  const [reviewers, liked, restaurants, stats] = await Promise.all([
    getReviewerLeaderboard(20),
    getMostLikedDishes(5),
    getRestaurants(),
    getCommunityStats(),
  ]);
  // Rating alone favours one-dish spots, so rank spots with 2+ dishes.
  const topSpots = sortRestaurants(
    restaurants.filter((spot) => spot.dishCount >= 2),
    "rating",
  ).slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <section className="mb-8 max-w-2xl">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent">
          <Trophy aria-hidden="true" className="h-3.5 w-3.5" />
          Community gastronomy
        </p>
        <h1 className="text-[30px] font-extrabold leading-[38px] tracking-tight text-ink sm:text-[40px] sm:leading-[48px]">
          Leaderboard
        </h1>
        <p className="mt-2 text-base leading-6 text-muted">
          {stats.dishes} {stats.dishes === 1 ? "dish" : "dishes"} shared so far, with {stats.likes}{" "}
          {stats.likes === 1 ? "like" : "likes"} between them. {stats.reviewers}{" "}
          {stats.reviewers === 1 ? "colleague has" : "colleagues have"} posted under their name.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-2xl border border-border-subtle bg-card p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-bold text-ink">Top recommenders</h2>
          <p className="mb-4 text-[13px] text-muted">
            Ranked by dishes shared, then likes received. Based on the name entered with each post —
            anonymous posts aren&apos;t counted.
          </p>
          {reviewers.length === 0 ? (
            <p className="rounded-xl bg-card-muted px-4 py-8 text-center text-sm text-muted">
              No named recommendations yet — add your name when you submit to appear here.
            </p>
          ) : (
            <ol className="divide-y divide-border-subtle">
              {reviewers.map((reviewer, index) => (
                <li key={reviewer.name} data-testid="leaderboard-row" className="flex items-center gap-3 py-3">
                  <span className="w-7 flex-shrink-0 text-center text-sm font-bold tabular-nums text-faint">
                    {index < 3 ? (
                      <Medal aria-label={`Rank ${index + 1}`} className={`mx-auto h-5 w-5 ${MEDAL[index]}`} />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent-soft font-bold uppercase text-accent"
                  >
                    {reviewer.name[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{reviewer.name}</p>
                    <p className="text-xs text-muted">
                      {reviewer.spots} {reviewer.spots === 1 ? "spot" : "spots"} · avg{" "}
                      {reviewer.avgRating.toFixed(1)}★
                    </p>
                  </div>
                  <CategoryBadge category={reviewer.topCategory} className="hidden sm:inline-flex" />
                  <div className="w-16 text-right">
                    <p className="font-bold text-ink">{reviewer.dishCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-faint">
                      {reviewer.dishCount === 1 ? "dish" : "dishes"}
                    </p>
                  </div>
                  <div className="w-12 text-right">
                    <p className="inline-flex items-center gap-1 font-bold text-ink">
                      <Heart aria-hidden="true" className="h-3.5 w-3.5 text-secondary" />
                      {reviewer.totalLikes}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border-subtle bg-card p-5 shadow-card">
            <h2 className="mb-3 text-base font-bold text-ink">Most-liked dishes</h2>
            {liked.length === 0 ? (
              <p className="text-sm text-muted">No likes yet.</p>
            ) : (
              <ol className="space-y-3">
                {liked.map((dish, index) => (
                  <li key={dish.id} className="flex items-center gap-3">
                    <span className="w-5 text-sm font-bold text-faint">{index + 1}</span>
                    <Link href={`/recommendation/${dish.id}`} className="min-w-0 flex-1 hover:text-accent">
                      <p className="truncate text-sm font-semibold text-ink">{dish.dishName}</p>
                      <p className="truncate text-xs text-muted">at {dish.restaurantName}</p>
                    </Link>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-ink">
                      <Heart aria-hidden="true" className="h-3.5 w-3.5 fill-secondary text-secondary" />
                      {dish.likeCount}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rounded-2xl border border-border-subtle bg-card p-5 shadow-card">
            <h2 className="text-base font-bold text-ink">Best-rated spots</h2>
            <p className="mb-3 text-xs text-muted">Spots with at least two dishes.</p>
            {topSpots.length === 0 ? (
              <p className="text-sm text-muted">No spot has two dishes yet.</p>
            ) : (
              <ol className="space-y-3">
                {topSpots.map((spot, index) => (
                  <li key={spot.slug} className="flex items-center gap-3">
                    <span className="w-5 text-sm font-bold text-faint">{index + 1}</span>
                    <Link href={`/restaurants/${spot.slug}`} className="min-w-0 flex-1 hover:text-accent">
                      <p className="truncate text-sm font-semibold text-ink">{spot.name}</p>
                      <p className="text-xs text-muted">{spot.dishCount} dishes</p>
                    </Link>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-ink">
                      <Star aria-hidden="true" className="h-3.5 w-3.5 fill-star text-star" />
                      {spot.avgRating.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
