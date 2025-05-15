/*
  Warnings:

  - You are about to drop the column `metadata` on the `MangaSeries` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `MangaVolume` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "VolumeMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filePath" TEXT NOT NULL,
    "series" TEXT,
    "title" TEXT,
    "number" REAL,
    "count" INTEGER,
    "publisher" TEXT,
    "genre" TEXT,
    "languageISO" TEXT,
    "ageRating" TEXT,
    "writer" TEXT,
    "penciller" TEXT,
    "inker" TEXT,
    "colorist" TEXT,
    "letterer" TEXT,
    "coverArtist" TEXT,
    "editor" TEXT,
    "translator" TEXT,
    "summary" TEXT,
    "web" TEXT,
    "tags" TEXT,
    "year" INTEGER,
    "month" INTEGER,
    "day" INTEGER,
    "gtin" TEXT,
    "mangaStyle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SeriesMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folderPath" TEXT NOT NULL,
    "series" TEXT,
    "summary" TEXT,
    "publisher" TEXT,
    "genre" TEXT,
    "languageISO" TEXT,
    "writer" TEXT,
    "artist" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MangaSeries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "isOneshot" BOOLEAN NOT NULL DEFAULT false,
    "mtime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadataId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MangaSeries_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "SeriesMetadata" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MangaSeries" ("createdAt", "id", "isOneshot", "mtime", "path", "slug", "title", "updatedAt") SELECT "createdAt", "id", "isOneshot", "mtime", "path", "slug", "title", "updatedAt" FROM "MangaSeries";
DROP TABLE "MangaSeries";
ALTER TABLE "new_MangaSeries" RENAME TO "MangaSeries";
CREATE UNIQUE INDEX "MangaSeries_slug_key" ON "MangaSeries"("slug");
CREATE UNIQUE INDEX "MangaSeries_metadataId_key" ON "MangaSeries"("metadataId");
CREATE TABLE "new_MangaVolume" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fullPath" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "mtime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coverImage" TEXT,
    "seriesId" INTEGER NOT NULL,
    "metadataId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MangaVolume_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "MangaSeries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MangaVolume_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "VolumeMetadata" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MangaVolume" ("coverImage", "createdAt", "filename", "fullPath", "id", "mtime", "seriesId", "size", "slug", "title", "updatedAt") SELECT "coverImage", "createdAt", "filename", "fullPath", "id", "mtime", "seriesId", "size", "slug", "title", "updatedAt" FROM "MangaVolume";
DROP TABLE "MangaVolume";
ALTER TABLE "new_MangaVolume" RENAME TO "MangaVolume";
CREATE UNIQUE INDEX "MangaVolume_slug_key" ON "MangaVolume"("slug");
CREATE UNIQUE INDEX "MangaVolume_metadataId_key" ON "MangaVolume"("metadataId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "VolumeMetadata_filePath_key" ON "VolumeMetadata"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesMetadata_folderPath_key" ON "SeriesMetadata"("folderPath");
