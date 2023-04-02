ALTER TABLE "User" RENAME TO "AppUser";
ALTER TABLE "HabiticaUser" RENAME COLUMN "userId" TO "appUserId";
ALTER TABLE "HabiticaUserAvatar" RENAME COLUMN "userId" TO "habiticaUserId";
ALTER TABLE "Integration" RENAME COLUMN "userId" TO "appUserId";
ALTER TABLE "LinearIntegration" RENAME COLUMN "userId" TO "appUserId";
