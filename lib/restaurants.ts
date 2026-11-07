import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { RECOMMENDATIONS_TAG } from "@/lib/recommendations";

// Restaurant names are free text (letters and spaces only), so the same place
// can be typed "Meghana Foods" and "meghana  foods". Everything here groups on
// a normalized key: trimmed, lower-cased, runs of spaces collapsed. The URL
// slug is that key with dashes for spaces.
const NORMALIZED = `lower(regexp_replace(trim("restaurantName"), '\\s+', ' ', 'g'))`;

import { canonicalName } from "@/lib/slug";

export { restaurantSlug } from "@/lib/slug";

function keyFromSlug(slug: string): string {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {}
  return decoded.toLowerCase().replace(/-+/g, " ").trim();
}

export type RestaurantSummary = {
  slug: string;
  name: string;
  dishCount: number;
  avgRating: number;
  minPrice: number;
  maxPrice: number;
  totalLikes: number;
  topCategory: string;
  coverUrl: string | null;
};

type RestaurantRow = Omit<RestaurantSummary, "slug" | "name"> & { key: string; names: string[] };

export const getRestaurants = unstable_cache(
  async (): Promise<RestaurantSummary[]> => {
    const rows = await prisma.$queryRawUnsafe<RestaurantRow[]>(`
      WITH base AS (
        SELECT r.*, ${NORMALIZED} AS key
        FROM "Recommendation" r
        WHERE trim(r."restaurantName") <> ''
      ),
      covers AS (
        SELECT DISTINCT ON (b.key) b.key, p.url
        FROM base b
        JOIN "Photo" p ON p."recommendationId" = b.id AND p."isPrimary"
        ORDER BY b.key, b.rating DESC, b."likeCount" DESC, b."createdAt" DESC
      )
      SELECT
        b.key,
        array_agg(b."restaurantName" ORDER BY b."createdAt" DESC) AS names,
        count(*)::int AS "dishCount",
        round(avg(b.rating)::numeric, 1)::float8 AS "avgRating",
        min(b.price)::float8 AS "minPrice",
        max(b.price)::float8 AS "maxPrice",
        sum(b."likeCount")::int AS "totalLikes",
        mode() WITHIN GROUP (ORDER BY b.category) AS "topCategory",
        c.url AS "coverUrl"
      FROM base b
      LEFT JOIN covers c ON c.key = b.key
      GROUP BY b.key, c.url
    `);
    return rows.map(({ key, names, ...row }) => ({
      ...row,
      name: canonicalName(names),
      slug: key.replace(/ /g, "-"),
    }));
  },
  ["restaurants-v2"],
  { tags: [RECOMMENDATIONS_TAG], revalidate: 60 },
);

export type RestaurantSort = "dishes" | "rating" | "liked";

export function sortRestaurants(list: RestaurantSummary[], sort: RestaurantSort): RestaurantSummary[] {
  const byName = (a: RestaurantSummary, b: RestaurantSummary) => a.name.localeCompare(b.name);
  const sorted = [...list];
  if (sort === "rating") {
    sorted.sort((a, b) => b.avgRating - a.avgRating || b.dishCount - a.dishCount || byName(a, b));
  } else if (sort === "liked") {
    sorted.sort((a, b) => b.totalLikes - a.totalLikes || b.dishCount - a.dishCount || byName(a, b));
  } else {
    sorted.sort((a, b) => b.dishCount - a.dishCount || b.avgRating - a.avgRating || byName(a, b));
  }
  return sorted;
}

export const getRestaurantDishes = unstable_cache(
  async (slug: string) => {
    const key = keyFromSlug(slug);
    if (!key) return [];
    const ids = await prisma.$queryRawUnsafe<{ id: number }[]>(
      `SELECT id FROM "Recommendation" WHERE ${NORMALIZED} = $1`,
      key,
    );
    if (ids.length === 0) return [];
    return prisma.recommendation.findMany({
      where: { id: { in: ids.map((row) => row.id) } },
      orderBy: [{ rating: "desc" }, { likeCount: "desc" }, { createdAt: "desc" }],
      include: { photos: { where: { isPrimary: true }, take: 1 } },
    });
  },
  ["restaurant-dishes-v1"],
  { tags: [RECOMMENDATIONS_TAG], revalidate: 60 },
);
