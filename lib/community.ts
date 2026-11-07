import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { RECOMMENDATIONS_TAG } from "@/lib/recommendations";

// Real numbers behind the "community" copy (trust banner, submit guidelines),
// in place of the design's invented claims.
export type CommunityStats = {
  dishes: number;
  reviewers: number;
  spots: number;
  likes: number;
  thisWeek: number;
  withNotes: { count: number; avgLikes: number };
  withoutNotes: { count: number; avgLikes: number };
};

export const getCommunityStats = unstable_cache(
  async (): Promise<CommunityStats> => {
    const [row] = await prisma.$queryRaw<
      {
        dishes: number;
        reviewers: number;
        spots: number;
        likes: number;
        this_week: number;
        notes_count: number;
        notes_avg: number | null;
        plain_count: number;
        plain_avg: number | null;
      }[]
    >`
      SELECT
        count(*)::int AS dishes,
        count(DISTINCT lower(trim("reviewerName"))) FILTER (WHERE trim(coalesce("reviewerName", '')) <> '')::int AS reviewers,
        count(DISTINCT lower(regexp_replace(trim("restaurantName"), '\\s+', ' ', 'g'))) FILTER (WHERE trim("restaurantName") <> '')::int AS spots,
        coalesce(sum("likeCount"), 0)::int AS likes,
        count(*) FILTER (WHERE "createdAt" >= date_trunc('week', now()))::int AS this_week,
        count(*) FILTER (WHERE trim(coalesce(notes, '')) <> '')::int AS notes_count,
        avg("likeCount") FILTER (WHERE trim(coalesce(notes, '')) <> '')::float8 AS notes_avg,
        count(*) FILTER (WHERE trim(coalesce(notes, '')) = '')::int AS plain_count,
        avg("likeCount") FILTER (WHERE trim(coalesce(notes, '')) = '')::float8 AS plain_avg
      FROM "Recommendation"
    `;
    return {
      dishes: row.dishes,
      reviewers: row.reviewers,
      spots: row.spots,
      likes: row.likes,
      thisWeek: row.this_week,
      withNotes: { count: row.notes_count, avgLikes: row.notes_avg ?? 0 },
      withoutNotes: { count: row.plain_count, avgLikes: row.plain_avg ?? 0 },
    };
  },
  ["community-stats-v1"],
  { tags: [RECOMMENDATIONS_TAG], revalidate: 60 },
);

export type ReviewerRank = {
  name: string;
  dishCount: number;
  totalLikes: number;
  avgRating: number;
  spots: number;
  topCategory: string;
};

// Ranked by the free-text name entered with each post (case-insensitive);
// anonymous posts aren't counted.
export const getReviewerLeaderboard = unstable_cache(
  async (limit: number): Promise<ReviewerRank[]> =>
    prisma.$queryRaw<ReviewerRank[]>`
      SELECT
        (array_agg(trim("reviewerName") ORDER BY "createdAt" DESC))[1] AS name,
        count(*)::int AS "dishCount",
        coalesce(sum("likeCount"), 0)::int AS "totalLikes",
        round(avg(rating)::numeric, 1)::float8 AS "avgRating",
        count(DISTINCT lower(regexp_replace(trim("restaurantName"), '\\s+', ' ', 'g')))::int AS spots,
        mode() WITHIN GROUP (ORDER BY category) AS "topCategory"
      FROM "Recommendation"
      WHERE trim(coalesce("reviewerName", '')) <> ''
      GROUP BY lower(trim("reviewerName"))
      ORDER BY "dishCount" DESC, "totalLikes" DESC, name ASC
      LIMIT ${limit}
    `,
  ["reviewer-leaderboard-v1"],
  { tags: [RECOMMENDATIONS_TAG], revalidate: 60 },
);

export const getMostLikedDishes = unstable_cache(
  async (limit: number) =>
    prisma.recommendation.findMany({
      where: { likeCount: { gt: 0 } },
      orderBy: [{ likeCount: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: { id: true, dishName: true, restaurantName: true, likeCount: true, rating: true, category: true },
    }),
  ["most-liked-dishes-v1"],
  { tags: [RECOMMENDATIONS_TAG], revalidate: 60 },
);
