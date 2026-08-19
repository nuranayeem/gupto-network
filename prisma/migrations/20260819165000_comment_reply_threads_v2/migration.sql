-- Add explicit edit timestamps for thread messages
ALTER TABLE "PostComment" ADD COLUMN "editedAt" TIMESTAMP(3);
ALTER TABLE "PostReply" ADD COLUMN "editedAt" TIMESTAMP(3);

-- Comment reactions
CREATE TABLE "CommentReaction" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL DEFAULT 'LIKE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommentReaction_pkey" PRIMARY KEY ("id")
);

-- Reply reactions
CREATE TABLE "ReplyReaction" (
    "id" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL DEFAULT 'LIKE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReplyReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommentReaction_commentId_userId_key" ON "CommentReaction"("commentId", "userId");
CREATE INDEX "CommentReaction_commentId_createdAt_idx" ON "CommentReaction"("commentId", "createdAt");
CREATE INDEX "CommentReaction_userId_createdAt_idx" ON "CommentReaction"("userId", "createdAt");

CREATE UNIQUE INDEX "ReplyReaction_replyId_userId_key" ON "ReplyReaction"("replyId", "userId");
CREATE INDEX "ReplyReaction_replyId_createdAt_idx" ON "ReplyReaction"("replyId", "createdAt");
CREATE INDEX "ReplyReaction_userId_createdAt_idx" ON "ReplyReaction"("userId", "createdAt");

ALTER TABLE "CommentReaction" ADD CONSTRAINT "CommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "PostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommentReaction" ADD CONSTRAINT "CommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReplyReaction" ADD CONSTRAINT "ReplyReaction_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "PostReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReplyReaction" ADD CONSTRAINT "ReplyReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
