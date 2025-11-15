/*
  Warnings:

  - You are about to drop the `SeriesMetadata` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `metadataId` on the `MangaSeries` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "SeriesMetadata_folderPath_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SeriesMetadata";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MangaSeries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "isOneshot" BOOLEAN NOT NULL DEFAULT false,
    "mtime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ONGOING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MangaSeries" ("createdAt", "id", "isOneshot", "mtime", "path", "slug", "status", "title", "updatedAt") SELECT "createdAt", "id", "isOneshot", "mtime", "path", "slug", "status", "title", "updatedAt" FROM "MangaSeries";
DROP TABLE "MangaSeries";
ALTER TABLE "new_MangaSeries" RENAME TO "MangaSeries";
CREATE UNIQUE INDEX "MangaSeries_slug_key" ON "MangaSeries"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
