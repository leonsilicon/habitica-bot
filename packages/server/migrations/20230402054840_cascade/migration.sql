-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Integration" (
    "userId" TEXT NOT NULL,
    CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Integration" ("userId") SELECT "userId" FROM "Integration";
DROP TABLE "Integration";
ALTER TABLE "new_Integration" RENAME TO "Integration";
CREATE UNIQUE INDEX "Integration_userId_key" ON "Integration"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
