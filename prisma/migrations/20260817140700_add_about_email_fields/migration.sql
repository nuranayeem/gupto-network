-- Add an auth-safe, private email value for the About section.
ALTER TABLE "User"
ADD COLUMN "aboutEmail" TEXT,
ADD COLUMN "aboutEmailVisible" BOOLEAN NOT NULL DEFAULT true;
