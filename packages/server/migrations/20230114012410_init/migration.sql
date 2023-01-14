-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discordUserId" TEXT NOT NULL,
    "habiticaUserId" TEXT NOT NULL,
    CONSTRAINT "User_habiticaUserId_fkey" FOREIGN KEY ("habiticaUserId") REFERENCES "HabiticaUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HabiticaUser" (
    "id" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_discordUserId_key" ON "User"("discordUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_habiticaUserId_key" ON "User"("habiticaUserId");

-- CreateIndex
CREATE UNIQUE INDEX "HabiticaUser_id_key" ON "HabiticaUser"("id");
