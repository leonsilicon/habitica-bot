/*
  Warnings:

  - Added the required column `linearUserId` to the `LinearIntegration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `webhookSigningSecret` to the `LinearIntegration` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LinearIntegration" (
    "appUserId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "webhookSigningSecret" TEXT NOT NULL,
    "linearUserId" TEXT NOT NULL,
    CONSTRAINT "LinearIntegration_appUserId_fkey" FOREIGN KEY ("appUserId") REFERENCES "Integration" ("appUserId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LinearIntegration_appUserId_fkey" FOREIGN KEY ("appUserId") REFERENCES "AppUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LinearIntegration" ("apiKey", "appUserId") SELECT "apiKey", "appUserId" FROM "LinearIntegration";
DROP TABLE "LinearIntegration";
ALTER TABLE "new_LinearIntegration" RENAME TO "LinearIntegration";
CREATE UNIQUE INDEX "LinearIntegration_appUserId_key" ON "LinearIntegration"("appUserId");
CREATE UNIQUE INDEX "LinearIntegration_linearUserId_key" ON "LinearIntegration"("linearUserId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- RedefineIndex
DROP INDEX "User_habiticaUserId_key";
CREATE UNIQUE INDEX "AppUser_habiticaUserId_key" ON "AppUser"("habiticaUserId");

-- RedefineIndex
DROP INDEX "User_discordUserId_key";
CREATE UNIQUE INDEX "AppUser_discordUserId_key" ON "AppUser"("discordUserId");

-- RedefineIndex
DROP INDEX "HabiticaUser_userId_key";
CREATE UNIQUE INDEX "HabiticaUser_appUserId_key" ON "HabiticaUser"("appUserId");

-- RedefineIndex
DROP INDEX "HabiticaUserAvatar_userId_key";
CREATE UNIQUE INDEX "HabiticaUserAvatar_habiticaUserId_key" ON "HabiticaUserAvatar"("habiticaUserId");

-- RedefineIndex
DROP INDEX "Integration_userId_key";
CREATE UNIQUE INDEX "Integration_appUserId_key" ON "Integration"("appUserId");
