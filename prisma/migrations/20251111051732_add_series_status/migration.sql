-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MangaSeries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "isOneshot" BOOLEAN NOT NULL DEFAULT false,
    "mtime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ONGOING',
    "metadataId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MangaSeries_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "SeriesMetadata" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MangaSeries" ("createdAt", "id", "isOneshot", "metadataId", "mtime", "path", "slug", "title", "updatedAt") SELECT "createdAt", "id", "isOneshot", "metadataId", "mtime", "path", "slug", "title", "updatedAt" FROM "MangaSeries";
DROP TABLE "MangaSeries";
ALTER TABLE "new_MangaSeries" RENAME TO "MangaSeries";
CREATE UNIQUE INDEX "MangaSeries_slug_key" ON "MangaSeries"("slug");
CREATE UNIQUE INDEX "MangaSeries_metadataId_key" ON "MangaSeries"("metadataId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
