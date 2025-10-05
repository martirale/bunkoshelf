-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyReadingLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyReadingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DailyReadingLog" ("createdAt", "date", "id", "userId") SELECT "createdAt", "date", "id", "userId" FROM "DailyReadingLog";
DROP TABLE "DailyReadingLog";
ALTER TABLE "new_DailyReadingLog" RENAME TO "DailyReadingLog";
CREATE UNIQUE INDEX "DailyReadingLog_userId_date_key" ON "DailyReadingLog"("userId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
