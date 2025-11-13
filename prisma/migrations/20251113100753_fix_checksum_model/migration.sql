-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FileChecksum" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filePath" TEXT,
    "checksum" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_FileChecksum" ("checksum", "createdAt", "filePath", "id", "updatedAt") SELECT "checksum", "createdAt", "filePath", "id", "updatedAt" FROM "FileChecksum";
DROP TABLE "FileChecksum";
ALTER TABLE "new_FileChecksum" RENAME TO "FileChecksum";
CREATE UNIQUE INDEX "FileChecksum_filePath_key" ON "FileChecksum"("filePath");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
