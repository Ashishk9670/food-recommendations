import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Supabase's session-mode pooler allows only 15 connections across ALL server
// instances, and every Vercel instance gets its own pool. pg's default of 10
// per pool let 2 busy instances exhaust it ("max clients reached"), so keep
// each instance small, drop idle connections fast, and fail fast instead of
// queueing a request forever when the database is saturated.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.VERCEL ? 3 : 10,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 10_000,
});

// Lets Vercel close idle connections before it suspends an instance, so a
// paused instance doesn't keep holding pooler slots.
if (process.env.VERCEL) attachDatabasePool(pool);

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
