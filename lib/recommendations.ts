import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/app/generated/prisma/client";

export const RECOMMENDATIONS_TAG = "recommendations";

export const getRecommendationsPage = unstable_cache(
  async (
    where: Prisma.RecommendationWhereInput,
    orderBy: Prisma.RecommendationOrderByWithRelationInput[],
    take: number,
  ) =>
    prisma.recommendation.findMany({
      where,
      orderBy,
      take,
      include: { photos: { where: { isPrimary: true }, take: 1 } },
    }),
  ["recommendations-page"],
  { tags: [RECOMMENDATIONS_TAG], revalidate: 60 },
);

// word_similarity() (not plain similarity()) — dish names are multi-word
// phrases, and plain similarity() scores a short/typo'd query against the
// *entire* string, which comes out far too low even for an obvious match
// (e.g. "briyani" vs "Boneless chicken biryani" scores ~0.14 with similarity()
// but ~0.38 with word_similarity(), which instead finds the best-matching
// word-boundary substring). Verified empirically: genuine typos score
// 0.35-0.7+, unrelated queries score 0, so 0.3 is a safe, well-separated cutoff.
// A plain ILIKE substring match is also included so exact/partial hits (the
// common case) are never filtered out by a similarity score that falls short.
// Left uncached (unlike getRecommendationsPage) so a just-submitted dish is
// always immediately searchable, not subject to a revalidate window.
const WORD_SIMILARITY_THRESHOLD = 0.3;

export async function findMatchingRecommendationIds(query: string): Promise<number[]> {
  const rows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM "Recommendation"
    WHERE "dishName" ILIKE ${"%" + query + "%"}
       OR "restaurantName" ILIKE ${"%" + query + "%"}
       OR word_similarity(${query}, "dishName") > ${WORD_SIMILARITY_THRESHOLD}
       OR word_similarity(${query}, "restaurantName") > ${WORD_SIMILARITY_THRESHOLD}
  `;
  return rows.map((row) => row.id);
}
