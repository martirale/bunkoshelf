/*
  Warnings:

  - You are about to drop the column `genre` on the `VolumeMetadata` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `VolumeMetadata` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Genre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "VolumeToGenre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "volumeId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,
    CONSTRAINT "VolumeToGenre_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "MangaVolume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VolumeToGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VolumeToTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "volumeId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    CONSTRAINT "VolumeToTag_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "MangaVolume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VolumeToTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeriesToGenre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seriesId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,
    CONSTRAINT "SeriesToGenre_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "MangaSeries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SeriesToGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VolumeMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filePath" TEXT NOT NULL,
    "series" TEXT,
    "title" TEXT,
    "number" REAL,
    "count" INTEGER,
    "publisher" TEXT,
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
    "year" INTEGER,
    "month" INTEGER,
    "day" INTEGER,
    "gtin" TEXT,
    "mangaStyle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_VolumeMetadata" ("ageRating", "colorist", "count", "coverArtist", "createdAt", "day", "editor", "filePath", "gtin", "id", "inker", "languageISO", "letterer", "mangaStyle", "month", "number", "penciller", "publisher", "series", "summary", "title", "translator", "updatedAt", "web", "writer", "year") SELECT "ageRating", "colorist", "count", "coverArtist", "createdAt", "day", "editor", "filePath", "gtin", "id", "inker", "languageISO", "letterer", "mangaStyle", "month", "number", "penciller", "publisher", "series", "summary", "title", "translator", "updatedAt", "web", "writer", "year" FROM "VolumeMetadata";
DROP TABLE "VolumeMetadata";
ALTER TABLE "new_VolumeMetadata" RENAME TO "VolumeMetadata";
CREATE UNIQUE INDEX "VolumeMetadata_filePath_key" ON "VolumeMetadata"("filePath");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VolumeToGenre_volumeId_genreId_key" ON "VolumeToGenre"("volumeId", "genreId");

-- CreateIndex
CREATE UNIQUE INDEX "VolumeToTag_volumeId_tagId_key" ON "VolumeToTag"("volumeId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesToGenre_seriesId_genreId_key" ON "SeriesToGenre"("seriesId", "genreId");
