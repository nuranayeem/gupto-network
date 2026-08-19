-- Allow a reply to target another reply in the same comment thread.
ALTER TABLE "PostReply" ADD COLUMN "parentReplyId" TEXT;

CREATE INDEX "PostReply_parentReplyId_createdAt_idx" ON "PostReply"("parentReplyId", "createdAt");

ALTER TABLE "PostReply"
ADD CONSTRAINT "PostReply_parentReplyId_fkey"
FOREIGN KEY ("parentReplyId") REFERENCES "PostReply"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
