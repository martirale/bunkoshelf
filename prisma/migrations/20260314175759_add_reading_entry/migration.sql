-- CreateTable
CREATE TABLE "ReadingEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "volumeId" TEXT NOT NULL,
    "readAt" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReadingEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReadingEntry_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "MangaVolume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ReadingEntry_userId_volumeId_idx" ON "ReadingEntry"("userId", "volumeId");
