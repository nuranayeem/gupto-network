-- Persist non-destructive cover/banner positioning chosen in Edit Profile.
ALTER TABLE "User"
ADD COLUMN "coverPositionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "coverPositionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "coverZoom" DOUBLE PRECISION NOT NULL DEFAULT 1;
