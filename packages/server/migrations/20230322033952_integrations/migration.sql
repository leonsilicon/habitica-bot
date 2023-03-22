-- CreateTable
CREATE TABLE "Integration" (
    "userId" TEXT NOT NULL,
    CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinearIntegration" (
    "userId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    CONSTRAINT "LinearIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Integration" ("userId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LinearIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Integration_userId_key" ON "Integration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LinearIntegration_userId_key" ON "LinearIntegration"("userId");
