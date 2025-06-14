-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SeriesToGenre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seriesId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,
    CONSTRAINT "SeriesToGenre_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "MangaSeries" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeriesToGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SeriesToGenre" ("genreId", "id", "seriesId") SELECT "genreId", "id", "seriesId" FROM "SeriesToGenre";
DROP TABLE "SeriesToGenre";
ALTER TABLE "new_SeriesToGenre" RENAME TO "SeriesToGenre";
CREATE UNIQUE INDEX "SeriesToGenre_seriesId_genreId_key" ON "SeriesToGenre"("seriesId", "genreId");
CREATE TABLE "new_VolumeToGenre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "volumeId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,
    CONSTRAINT "VolumeToGenre_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "MangaVolume" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VolumeToGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_VolumeToGenre" ("genreId", "id", "volumeId") SELECT "genreId", "id", "volumeId" FROM "VolumeToGenre";
DROP TABLE "VolumeToGenre";
ALTER TABLE "new_VolumeToGenre" RENAME TO "VolumeToGenre";
CREATE UNIQUE INDEX "VolumeToGenre_volumeId_genreId_key" ON "VolumeToGenre"("volumeId", "genreId");
CREATE TABLE "new_VolumeToTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "volumeId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    CONSTRAINT "VolumeToTag_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "MangaVolume" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VolumeToTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_VolumeToTag" ("id", "tagId", "volumeId") SELECT "id", "tagId", "volumeId" FROM "VolumeToTag";
DROP TABLE "VolumeToTag";
ALTER TABLE "new_VolumeToTag" RENAME TO "VolumeToTag";
CREATE UNIQUE INDEX "VolumeToTag_volumeId_tagId_key" ON "VolumeToTag"("volumeId", "tagId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
