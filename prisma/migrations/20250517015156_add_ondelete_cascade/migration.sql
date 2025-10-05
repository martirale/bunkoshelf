-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "MangaVolume_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "MangaSeries" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MangaVolume_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "VolumeMetadata" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MangaVolume" ("coverImage", "createdAt", "filename", "fullPath", "id", "metadataId", "mtime", "seriesId", "size", "slug", "title", "updatedAt") SELECT "coverImage", "createdAt", "filename", "fullPath", "id", "metadataId", "mtime", "seriesId", "size", "slug", "title", "updatedAt" FROM "MangaVolume";
DROP TABLE "MangaVolume";
ALTER TABLE "new_MangaVolume" RENAME TO "MangaVolume";
CREATE UNIQUE INDEX "MangaVolume_slug_key" ON "MangaVolume"("slug");
CREATE UNIQUE INDEX "MangaVolume_metadataId_key" ON "MangaVolume"("metadataId");
CREATE TABLE "new_UserToSeries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserToSeries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserToSeries_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "MangaSeries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserToSeries" ("createdAt", "id", "isFavorite", "seriesId", "updatedAt", "userId") SELECT "createdAt", "id", "isFavorite", "seriesId", "updatedAt", "userId" FROM "UserToSeries";
DROP TABLE "UserToSeries";
ALTER TABLE "new_UserToSeries" RENAME TO "UserToSeries";
CREATE UNIQUE INDEX "UserToSeries_userId_seriesId_key" ON "UserToSeries"("userId", "seriesId");
CREATE TABLE "new_UserToVolume" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "volumeId" INTEGER NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserToVolume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserToVolume_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "MangaVolume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserToVolume" ("createdAt", "id", "isFavorite", "isRead", "updatedAt", "userId", "volumeId") SELECT "createdAt", "id", "isFavorite", "isRead", "updatedAt", "userId", "volumeId" FROM "UserToVolume";
DROP TABLE "UserToVolume";
ALTER TABLE "new_UserToVolume" RENAME TO "UserToVolume";
CREATE UNIQUE INDEX "UserToVolume_userId_volumeId_key" ON "UserToVolume"("userId", "volumeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
