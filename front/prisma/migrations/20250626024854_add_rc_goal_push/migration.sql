-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReadingChallenge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "goal" INTEGER NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReadingChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReadingChallenge" ("createdAt", "goal", "id", "updatedAt", "userId", "year") SELECT "createdAt", "goal", "id", "updatedAt", "userId", "year" FROM "ReadingChallenge";
DROP TABLE "ReadingChallenge";
ALTER TABLE "new_ReadingChallenge" RENAME TO "ReadingChallenge";
CREATE UNIQUE INDEX "ReadingChallenge_userId_year_key" ON "ReadingChallenge"("userId", "year");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
