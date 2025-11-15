-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MangaVolume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fullPath" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "mtime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coverImage" TEXT,
    "seriesId" TEXT NOT NULL,
    "metadataId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MangaVolume_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "MangaSeries" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MangaVolume_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "VolumeMetadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MangaVolume" ("coverImage", "createdAt", "filename", "fullPath", "id", "metadataId", "mtime", "seriesId", "size", "slug", "title", "updatedAt") SELECT "coverImage", "createdAt", "filename", "fullPath", "id", "metadataId", "mtime", "seriesId", "size", "slug", "title", "updatedAt" FROM "MangaVolume";
DROP TABLE "MangaVolume";
ALTER TABLE "new_MangaVolume" RENAME TO "MangaVolume";
CREATE UNIQUE INDEX "MangaVolume_slug_key" ON "MangaVolume"("slug");
CREATE UNIQUE INDEX "MangaVolume_metadataId_key" ON "MangaVolume"("metadataId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
