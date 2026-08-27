CREATE TYPE "StoryMediaType" AS ENUM ('PHOTO', 'VIDEO', 'MUSIC', 'PHOTO_MUSIC');
CREATE TYPE "StoryAudience" AS ENUM ('PUBLIC', 'FOLLOWERS', 'PRIVATE');

CREATE TABLE "Story" (
  "id" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "mediaType" "StoryMediaType" NOT NULL,
  "mediaUrl" TEXT,
  "audioUrl" TEXT,
  "caption" VARCHAR(180),
  "musicTitle" VARCHAR(80),
  "accent" VARCHAR(24) NOT NULL DEFAULT 'violet',
  "audience" "StoryAudience" NOT NULL DEFAULT 'PUBLIC',
  "durationSeconds" INTEGER NOT NULL DEFAULT 7,
  "allowReplies" BOOLEAN NOT NULL DEFAULT true,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoryView" (
  "id" TEXT NOT NULL,
  "storyId" TEXT NOT NULL,
  "viewerId" TEXT NOT NULL,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoryView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Story_authorId_createdAt_idx" ON "Story"("authorId", "createdAt");
CREATE INDEX "Story_expiresAt_idx" ON "Story"("expiresAt");
CREATE INDEX "Story_audience_expiresAt_idx" ON "Story"("audience", "expiresAt");
CREATE UNIQUE INDEX "StoryView_storyId_viewerId_key" ON "StoryView"("storyId", "viewerId");
CREATE INDEX "StoryView_viewerId_viewedAt_idx" ON "StoryView"("viewerId", "viewedAt");

ALTER TABLE "Story" ADD CONSTRAINT "Story_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryView" ADD CONSTRAINT "StoryView_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryView" ADD CONSTRAINT "StoryView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
