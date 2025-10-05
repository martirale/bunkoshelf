-- CreateTable
CREATE TABLE "UserToSeries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserToSeries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserToSeries_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "MangaSeries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserToVolume" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "volumeId" INTEGER NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserToVolume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserToVolume_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "MangaVolume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserToSeries_userId_seriesId_key" ON "UserToSeries"("userId", "seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "UserToVolume_userId_volumeId_key" ON "UserToVolume"("userId", "volumeId");
