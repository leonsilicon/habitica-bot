-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discordUserId" TEXT NOT NULL,
    "habiticaUserId" TEXT NOT NULL,
    "areTasksPublic" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "User_habiticaUserId_fkey" FOREIGN KEY ("habiticaUserId") REFERENCES "HabiticaUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("discordUserId", "habiticaUserId", "id") SELECT "discordUserId", "habiticaUserId", "id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_discordUserId_key" ON "User"("discordUserId");
CREATE UNIQUE INDEX "User_habiticaUserId_key" ON "User"("habiticaUserId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
