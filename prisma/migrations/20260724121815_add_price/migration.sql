-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Recommendation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dishName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "imageUrl" TEXT NOT NULL,
    "restaurantName" TEXT,
    "reviewerName" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Recommendation" ("category", "createdAt", "dishName", "id", "imageUrl", "notes", "rating", "restaurantName", "reviewerName") SELECT "category", "createdAt", "dishName", "id", "imageUrl", "notes", "rating", "restaurantName", "reviewerName" FROM "Recommendation";
DROP TABLE "Recommendation";
ALTER TABLE "new_Recommendation" RENAME TO "Recommendation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
