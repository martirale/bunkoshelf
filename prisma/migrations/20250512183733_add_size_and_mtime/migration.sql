-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MangaSeries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "isOneshot" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "size" INTEGER NOT NULL DEFAULT 0,
    "mtime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MangaSeries" ("createdAt", "id", "isOneshot", "metadata", "path", "slug", "title", "updatedAt") SELECT "createdAt", "id", "isOneshot", "metadata", "path", "slug", "title", "updatedAt" FROM "MangaSeries";
DROP TABLE "MangaSeries";
ALTER TABLE "new_MangaSeries" RENAME TO "MangaSeries";
CREATE UNIQUE INDEX "MangaSeries_slug_key" ON "MangaSeries"("slug");
CREATE TABLE "new_MangaVolume" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fullPath" TEXT NOT NULL,
    "metadata" JSONB,
    "seriesId" INTEGER NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "mtime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MangaVolume_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "MangaSeries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MangaVolume" ("createdAt", "filename", "fullPath", "id", "metadata", "seriesId", "slug", "title", "updatedAt") SELECT "createdAt", "filename", "fullPath", "id", "metadata", "seriesId", "slug", "title", "updatedAt" FROM "MangaVolume";
DROP TABLE "MangaVolume";
ALTER TABLE "new_MangaVolume" RENAME TO "MangaVolume";
CREATE UNIQUE INDEX "MangaVolume_slug_key" ON "MangaVolume"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
