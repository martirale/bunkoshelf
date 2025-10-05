-- CreateTable
CREATE TABLE "MangaSeries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "isOneshot" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MangaVolume" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fullPath" TEXT NOT NULL,
    "metadata" JSONB,
    "seriesId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MangaVolume_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "MangaSeries" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MangaSeries_slug_key" ON "MangaSeries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MangaVolume_slug_key" ON "MangaVolume"("slug");
