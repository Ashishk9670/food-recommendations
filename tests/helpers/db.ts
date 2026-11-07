import dotenv from "dotenv";
import { createHash, randomBytes, scryptSync } from "node:crypto";
import { Pool } from "pg";

dotenv.config({ path: ".env.test" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const BASE_URL = `http://localhost:${process.env.PLAYWRIGHT_PORT ?? 3100}`;

export type SeedRow = {
  dishName: string;
  restaurantName: string;
  category: string;
  rating: number;
  price: number;
  likeCount: number;
  imageUrl: string;
  createdAt: Date;
  editToken?: string;
  reviewerName?: string;
  notes?: string;
};

// Seeding/cleanup here bypasses the app's own mutation routes (deliberately,
// to stay under the real rate limits), so nothing calls revalidateTag — without
// this, the browse page's unstable_cache can serve stale pre-seed/pre-cleanup
// results for up to its 60s revalidate window across back-to-back test runs.
async function bustRecommendationsCache(): Promise<void> {
  await fetch(`${BASE_URL}/api/test/revalidate`, { method: "POST" }).catch(() => {});
}

export async function seedRecommendations(rows: SeedRow[]): Promise<number[]> {
  const ids: number[] = [];
  for (const row of rows) {
    const { rows: inserted } = await pool.query<{ id: number }>(
      `INSERT INTO "Recommendation"
        ("dishName", "restaurantName", "category", "rating", "price", "likeCount", "editToken", "createdAt", "reviewerName", "notes")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING "id"`,
      [
        row.dishName,
        row.restaurantName,
        row.category,
        row.rating,
        row.price,
        row.likeCount,
        row.editToken ?? "",
        row.createdAt,
        row.reviewerName ?? null,
        row.notes ?? null,
      ],
    );
    const recommendationId = inserted[0].id;
    ids.push(recommendationId);
    await pool.query(
      `INSERT INTO "Photo" ("recommendationId", "url", "order", "isPrimary")
       VALUES ($1, $2, 0, true)`,
      [recommendationId, row.imageUrl],
    );
  }
  await bustRecommendationsCache();
  return ids;
}

export async function deleteRecommendationsByPrefix(prefix: string): Promise<void> {
  await pool.query(`DELETE FROM "Recommendation" WHERE "dishName" LIKE $1`, [`${prefix}%`]);
  await bustRecommendationsCache();
}

// Deliberately no closeDb()/pool.end() export: this pool is a module-level
// singleton shared by every spec file that imports it. Playwright can (and on
// CI, does) schedule multiple spec files' afterAll hooks onto the same worker
// process one after another — if one file ended the shared pool, the next
// file's afterAll would crash with "Cannot use a pool after calling end on the
// pool" trying to run its own cleanup. The worker process's own teardown
// closes the connection when it exits; no per-file close is needed or safe.

// ---------- admin accounts ----------
// Sessions are created straight in the DB (the same shape lib/admin.ts
// writes) so specs can act as the owner or a team admin without spending the
// 5-per-15-minutes real login budget.

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function createAdminUser(
  username: string,
  password: string,
): Promise<{ id: number; passwordHash: string }> {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  const passwordHash = `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO "AdminUser" ("username", "passwordHash", "createdBy") VALUES ($1, $2, 'owner') RETURNING "id"`,
    [username, passwordHash],
  );
  return { id: rows[0].id, passwordHash };
}

export async function createAdminSessionCookie(
  user: { id: number; passwordHash: string } | null,
): Promise<{ name: string; value: string; url: string }> {
  const token = randomBytes(32).toString("base64url");
  const fingerprint = user
    ? sha256(`user:${user.passwordHash}`).slice(0, 32)
    : sha256(`owner:${process.env.ADMIN_PASSWORD ?? ""}`).slice(0, 32);
  await pool.query(
    `INSERT INTO "AdminSession" ("tokenHash", "adminUserId", "credentialFingerprint", "expiresAt")
     VALUES ($1, $2, $3, now() + interval '1 day')`,
    [sha256(token), user?.id ?? null, fingerprint],
  );
  return { name: "admin_session", value: token, url: BASE_URL };
}

export async function deleteAdminUsersByPrefix(prefix: string): Promise<void> {
  await pool.query(`DELETE FROM "AdminUser" WHERE "username" LIKE $1`, [`${prefix}%`]);
  await pool.query(`DELETE FROM "AuditLog" WHERE "actor" LIKE $1 OR "detail" LIKE $1`, [`${prefix}%`]);
}
