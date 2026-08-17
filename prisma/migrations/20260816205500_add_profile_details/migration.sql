ALTER TABLE "User"
ADD COLUMN "location" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "avatarTheme" TEXT NOT NULL DEFAULT 'midnight';
