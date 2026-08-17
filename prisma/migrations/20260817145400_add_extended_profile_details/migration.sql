-- Extended profile details for hometown, education and relationship status.
ALTER TABLE "User"
ADD COLUMN "hometown" TEXT,
ADD COLUMN "school" TEXT,
ADD COLUMN "college" TEXT,
ADD COLUMN "university" TEXT,
ADD COLUMN "relationshipStatus" TEXT;
