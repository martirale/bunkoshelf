-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "name" TEXT,
    "lastname" TEXT,
    "birthYear" INTEGER
);
INSERT INTO "new_User" ("birthYear", "createdAt", "id", "isAdmin", "role", "lastname", "name", "password", "username") SELECT "birthYear", "createdAt", "id", "isAdmin", CASE WHEN "isAdmin" = 1 THEN 'ADMIN' ELSE 'MEMBER' END, "lastname", "name", "password", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
