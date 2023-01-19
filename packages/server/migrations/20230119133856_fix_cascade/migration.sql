/*
  Warnings:

  - Added the required column `userId` to the `HabiticaUser` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HabiticaUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    CONSTRAINT "HabiticaUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_HabiticaUser" ("apiToken", "id", "name", "username", "userId") SELECT h."apiToken", h."id", h."name", h."username", u."id" FROM "HabiticaUser" h INNER JOIN "User" u on u."habiticaUserId" = h."id";
DROP TABLE "HabiticaUser";
ALTER TABLE "new_HabiticaUser" RENAME TO "HabiticaUser";
CREATE UNIQUE INDEX "HabiticaUser_id_key" ON "HabiticaUser"("id");
CREATE UNIQUE INDEX "HabiticaUser_userId_key" ON "HabiticaUser"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discordUserId" TEXT NOT NULL,
    "habiticaUserId" TEXT NOT NULL,
    "areTasksPublic" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("areTasksPublic", "discordUserId", "habiticaUserId", "id") SELECT "areTasksPublic", "discordUserId", "habiticaUserId", "id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_discordUserId_key" ON "User"("discordUserId");
CREATE UNIQUE INDEX "User_habiticaUserId_key" ON "User"("habiticaUserId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
