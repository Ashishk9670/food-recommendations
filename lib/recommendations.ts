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
