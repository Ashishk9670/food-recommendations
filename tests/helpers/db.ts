import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.test" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const BASE_URL = "http://localhost:3100";

export type SeedRow = {
  dishName: string;
  restaurantName: string;
  category: string;
  rating: number;
  price: number;
  likeCount: number;
  imageUrl: string;
  createdAt: Date;
};

// Seeding/cleanup here bypasses the app's own mutation routes (deliberately,
// to stay under the real rate limits), so nothing calls revalidateTag — without
// this, the browse page's unstable_cache can serve stale pre-seed/pre-cleanup
// results for up to its 60s revalidate window across back-to-back test runs.
async function bustRecommendationsCache(): Promise<void> {
  await fetch(`${BASE_URL}/api/test/revalidate`, { method: "POST" }).catch(() => {});
}

export async function seedRecommendations(rows: SeedRow[]): Promise<void> {
  for (const row of rows) {
    const { rows: inserted } = await pool.query<{ id: number }>(
      `INSERT INTO "Recommendation"
        ("dishName", "restaurantName", "category", "rating", "price", "likeCount", "editToken", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, '', $7)
       RETURNING "id"`,
      [row.dishName, row.restaurantName, row.category, row.rating, row.price, row.likeCount, row.createdAt],
    );
    const recommendationId = inserted[0].id;
    await pool.query(
      `INSERT INTO "Photo" ("recommendationId", "url", "order", "isPrimary")
       VALUES ($1, $2, 0, true)`,
      [recommendationId, row.imageUrl],
    );
  }
  await bustRecommendationsCache();
}

export async function deleteRecommendationsByPrefix(prefix: string): Promise<void> {
  await pool.query(`DELETE FROM "Recommendation" WHERE "dishName" LIKE $1`, [`${prefix}%`]);
  await bustRecommendationsCache();
}

export async function closeDb(): Promise<void> {
  await pool.end();
}
