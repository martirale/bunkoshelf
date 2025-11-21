-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReadingChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "goal" INTEGER NOT NULL,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReadingChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReadingChallenge" ("createdAt", "goal", "id", "notified", "updatedAt", "userId", "year") SELECT "createdAt", "goal", "id", "notified", "updatedAt", "userId", "year" FROM "ReadingChallenge";
DROP TABLE "ReadingChallenge";
ALTER TABLE "new_ReadingChallenge" RENAME TO "ReadingChallenge";
CREATE UNIQUE INDEX "ReadingChallenge_userId_year_key" ON "ReadingChallenge"("userId", "year");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
