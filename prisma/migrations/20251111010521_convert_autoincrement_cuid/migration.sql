/*
  Warnings:

  - The primary key for the `DailyReadingLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Genre` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `MangaSeries` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `MangaVolume` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PushSubscription` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ReadingChallenge` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `SeriesToGenre` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Tag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserToSeries` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserToVolume` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `VolumeToGenre` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `VolumeToTag` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyReadingLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyReadingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DailyReadingLog" ("createdAt", "date", "id", "userId") SELECT "createdAt", "date", "id", "userId" FROM "DailyReadingLog";
DROP TABLE "DailyReadingLog";
ALTER TABLE "new_DailyReadingLog" RENAME TO "DailyReadingLog";
CREATE UNIQUE INDEX "DailyReadingLog_userId_date_key" ON "DailyReadingLog"("userId", "date");
CREATE TABLE "new_Genre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);
INSERT INTO "new_Genre" ("id", "name") SELECT "id", "name" FROM "Genre";
DROP TABLE "Genre";
ALTER TABLE "new_Genre" RENAME TO "Genre";
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");
CREATE TABLE "new_MangaSeries" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_MangaSeries" ("createdAt", "id", "isOneshot", "metadataId", "mtime", "path", "slug", "title", "updatedAt") SELECT "createdAt", "id", "isOneshot", "metadataId", "mtime", "path", "slug", "title", "updatedAt" FROM "MangaSeries";
DROP TABLE "MangaSeries";
ALTER TABLE "new_MangaSeries" RENAME TO "MangaSeries";
CREATE UNIQUE INDEX "MangaSeries_slug_key" ON "MangaSeries"("slug");
CREATE UNIQUE INDEX "MangaSeries_metadataId_key" ON "MangaSeries"("metadataId");
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
    CONSTRAINT "MangaVolume_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "VolumeMetadata" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MangaVolume" ("coverImage", "createdAt", "filename", "fullPath", "id", "metadataId", "mtime", "seriesId", "size", "slug", "title", "updatedAt") SELECT "coverImage", "createdAt", "filename", "fullPath", "id", "metadataId", "mtime", "seriesId", "size", "slug", "title", "updatedAt" FROM "MangaVolume";
DROP TABLE "MangaVolume";
ALTER TABLE "new_MangaVolume" RENAME TO "MangaVolume";
CREATE UNIQUE INDEX "MangaVolume_slug_key" ON "MangaVolume"("slug");
CREATE UNIQUE INDEX "MangaVolume_metadataId_key" ON "MangaVolume"("metadataId");
CREATE TABLE "new_PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PushSubscription" ("createdAt", "endpoint", "id", "keys", "userId") SELECT "createdAt", "endpoint", "id", "keys", "userId" FROM "PushSubscription";
DROP TABLE "PushSubscription";
ALTER TABLE "new_PushSubscription" RENAME TO "PushSubscription";
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");
CREATE TABLE "new_ReadingChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "goal" INTEGER NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReadingChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReadingChallenge" ("createdAt", "goal", "id", "notified", "updatedAt", "userId", "year") SELECT "createdAt", "goal", "id", "notified", "updatedAt", "userId", "year" FROM "ReadingChallenge";
DROP TABLE "ReadingChallenge";
ALTER TABLE "new_ReadingChallenge" RENAME TO "ReadingChallenge";
CREATE UNIQUE INDEX "ReadingChallenge_userId_year_key" ON "ReadingChallenge"("userId", "year");
CREATE TABLE "new_SeriesToGenre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seriesId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,
    CONSTRAINT "SeriesToGenre_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "MangaSeries" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeriesToGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SeriesToGenre" ("genreId", "id", "seriesId") SELECT "genreId", "id", "seriesId" FROM "SeriesToGenre";
DROP TABLE "SeriesToGenre";
ALTER TABLE "new_SeriesToGenre" RENAME TO "SeriesToGenre";
CREATE UNIQUE INDEX "SeriesToGenre_seriesId_genreId_key" ON "SeriesToGenre"("seriesId", "genreId");
CREATE TABLE "new_Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);
INSERT INTO "new_Tag" ("id", "name") SELECT "id", "name" FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "lastname" TEXT,
    "birthYear" INTEGER
);
INSERT INTO "new_User" ("birthYear", "createdAt", "id", "isAdmin", "lastname", "name", "password", "username") SELECT "birthYear", "createdAt", "id", "isAdmin", "lastname", "name", "password", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE TABLE "new_UserToSeries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
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
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "volumeId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "lastPage" INTEGER,
    "totalPages" INTEGER,
    "lastReadAt" DATETIME,
    "firstRead" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserToVolume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserToVolume_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "MangaVolume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserToVolume" ("createdAt", "firstRead", "id", "isFavorite", "isRead", "lastPage", "lastReadAt", "totalPages", "updatedAt", "userId", "volumeId") SELECT "createdAt", "firstRead", "id", "isFavorite", "isRead", "lastPage", "lastReadAt", "totalPages", "updatedAt", "userId", "volumeId" FROM "UserToVolume";
DROP TABLE "UserToVolume";
ALTER TABLE "new_UserToVolume" RENAME TO "UserToVolume";
CREATE UNIQUE INDEX "UserToVolume_userId_volumeId_key" ON "UserToVolume"("userId", "volumeId");
CREATE TABLE "new_VolumeToGenre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "volumeId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,
    CONSTRAINT "VolumeToGenre_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "MangaVolume" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VolumeToGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_VolumeToGenre" ("genreId", "id", "volumeId") SELECT "genreId", "id", "volumeId" FROM "VolumeToGenre";
DROP TABLE "VolumeToGenre";
ALTER TABLE "new_VolumeToGenre" RENAME TO "VolumeToGenre";
CREATE UNIQUE INDEX "VolumeToGenre_volumeId_genreId_key" ON "VolumeToGenre"("volumeId", "genreId");
CREATE TABLE "new_VolumeToTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "volumeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "VolumeToTag_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "MangaVolume" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VolumeToTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_VolumeToTag" ("id", "tagId", "volumeId") SELECT "id", "tagId", "volumeId" FROM "VolumeToTag";
DROP TABLE "VolumeToTag";
ALTER TABLE "new_VolumeToTag" RENAME TO "VolumeToTag";
CREATE UNIQUE INDEX "VolumeToTag_volumeId_tagId_key" ON "VolumeToTag"("volumeId", "tagId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
