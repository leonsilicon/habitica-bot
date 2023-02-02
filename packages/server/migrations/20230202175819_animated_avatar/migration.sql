/*
  Warnings:

  - You are about to drop the column `cachedAvatarBase64` on the `HabiticaUser` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "HabiticaUserAvatar" (
    "userId" TEXT NOT NULL,
    "base64Data" TEXT NOT NULL,
    "isAnimated" BOOLEAN NOT NULL,
    CONSTRAINT "HabiticaUserAvatar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "HabiticaUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
INSERT INTO "new_HabiticaUser" ("apiToken", "id", "name", "userId", "username") SELECT "apiToken", "id", "name", "userId", "username" FROM "HabiticaUser";
DROP TABLE "HabiticaUser";
ALTER TABLE "new_HabiticaUser" RENAME TO "HabiticaUser";
CREATE UNIQUE INDEX "HabiticaUser_id_key" ON "HabiticaUser"("id");
CREATE UNIQUE INDEX "HabiticaUser_userId_key" ON "HabiticaUser"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "HabiticaUserAvatar_userId_key" ON "HabiticaUserAvatar"("userId");
