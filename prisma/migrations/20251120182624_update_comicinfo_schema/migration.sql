/*
  Warnings:

  - You are about to drop the column `translator` on the `VolumeMetadata` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VolumeMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filePath" TEXT NOT NULL,
    "title" TEXT,
    "series" TEXT,
    "number" REAL,
    "count" INTEGER,
    "summary" TEXT,
    "year" INTEGER,
    "month" INTEGER,
    "day" INTEGER,
    "writer" TEXT,
    "penciller" TEXT,
    "inker" TEXT,
    "colorist" TEXT,
    "letterer" TEXT,
    "coverArtist" TEXT,
    "editor" TEXT,
    "publisher" TEXT,
    "imprint" TEXT,
    "web" TEXT,
    "pageCount" INTEGER,
    "languageISO" TEXT,
    "format" TEXT,
    "mangaStyle" TEXT,
    "ageRating" TEXT,
    "communityRating" REAL,
    "gtin" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_VolumeMetadata" ("ageRating", "colorist", "count", "coverArtist", "createdAt", "day", "editor", "filePath", "gtin", "id", "inker", "languageISO", "letterer", "mangaStyle", "month", "number", "penciller", "publisher", "series", "summary", "title", "updatedAt", "web", "writer", "year") SELECT "ageRating", "colorist", "count", "coverArtist", "createdAt", "day", "editor", "filePath", "gtin", "id", "inker", "languageISO", "letterer", "mangaStyle", "month", "number", "penciller", "publisher", "series", "summary", "title", "updatedAt", "web", "writer", "year" FROM "VolumeMetadata";
DROP TABLE "VolumeMetadata";
ALTER TABLE "new_VolumeMetadata" RENAME TO "VolumeMetadata";
CREATE UNIQUE INDEX "VolumeMetadata_filePath_key" ON "VolumeMetadata"("filePath");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
