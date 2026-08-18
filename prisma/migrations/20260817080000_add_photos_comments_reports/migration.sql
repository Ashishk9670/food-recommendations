-- Expand: create the new tables (imageUrl stays alive for the backfill below)
CREATE TABLE "Photo" (
    "id" SERIAL NOT NULL,
    "recommendationId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "recommendationId" INTEGER NOT NULL,
    "authorName" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "recommendationId" INTEGER NOT NULL,
    "reporterIpHash" TEXT,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Photo_recommendationId_order_idx" ON "Photo"("recommendationId", "order");
CREATE INDEX "Comment_recommendationId_createdAt_idx" ON "Comment"("recommendationId", "createdAt");
CREATE INDEX "Report_recommendationId_dismissed_idx" ON "Report"("recommendationId", "dismissed");
CREATE INDEX "Recommendation_createdAt_idx" ON "Recommendation"("createdAt");
CREATE INDEX "Recommendation_likeCount_idx" ON "Recommendation"("likeCount");

ALTER TABLE "Photo" ADD CONSTRAINT "Photo_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing dish's single imageUrl becomes its cover photo
INSERT INTO "Photo" ("recommendationId", "url", "order", "isPrimary")
SELECT "id", "imageUrl", 0, true FROM "Recommendation";

-- Contract: the single-photo column is now fully replaced by the Photo table
ALTER TABLE "Recommendation" DROP COLUMN "imageUrl";
