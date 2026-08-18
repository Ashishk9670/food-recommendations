-- Enables fuzzy/typo-tolerant search: trigram similarity lets a search for
-- "biryni" or "briyani" still match "Biryani" rows, which a plain ILIKE
-- substring match never can.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram indexes also accelerate the existing ILIKE '%...%' substring
-- matches, not just similarity() queries, so this is a pure win for both.
CREATE INDEX "Recommendation_dishName_trgm_idx" ON "Recommendation" USING GIN ("dishName" gin_trgm_ops);
CREATE INDEX "Recommendation_restaurantName_trgm_idx" ON "Recommendation" USING GIN ("restaurantName" gin_trgm_ops);
