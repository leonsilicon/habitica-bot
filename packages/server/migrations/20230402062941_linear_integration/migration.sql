/*
  Warnings:

  - Added the required column `linearUserId` to the `LinearIntegration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `webhookSigningSecret` to the `LinearIntegration` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LinearIntegration" (
    "userId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "webhookSigningSecret" TEXT NOT NULL,
    "linearUserId" TEXT NOT NULL,
    CONSTRAINT "LinearIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Integration" ("userId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LinearIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LinearIntegration" ("apiKey", "userId") SELECT "apiKey", "userId" FROM "LinearIntegration";
DROP TABLE "LinearIntegration";
ALTER TABLE "new_LinearIntegration" RENAME TO "LinearIntegration";
CREATE UNIQUE INDEX "LinearIntegration_userId_key" ON "LinearIntegration"("userId");
CREATE UNIQUE INDEX "LinearIntegration_linearUserId_key" ON "LinearIntegration"("linearUserId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
