import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canViewPost } from "@/lib/post-access";

const reactionSchema = z.object({
  type: z.enum(["LIKE", "LOVE", "CARE", "HAHA", "WOW", "SAD", "ANGRY", "SANDAL"]).default("LIKE"),
});

export async function POST(request: Request, { params }: { params: Promise<{ postId: string; commentId: string; replyId: string }> }) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const viewer = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!viewer) return NextResponse.json({ error: "User account not found." }, { status: 401 });

  const { postId, commentId, replyId } = await params;
  if (!(await canViewPost(postId, viewer.id))) return NextResponse.json({ error: "Post not found or unavailable." }, { status: 404 });
  const reply = await prisma.postReply.findFirst({ where: { id: replyId, commentId, comment: { postId } }, select: { id: true } });
  if (!reply) return NextResponse.json({ error: "Reply not found." }, { status: 404 });

  const parsed = reactionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid reaction." }, { status: 400 });

  const existing = await prisma.replyReaction.findUnique({ where: { replyId_userId: { replyId, userId: viewer.id } }, select: { id: true, type: true } });
  let reacted = true;
  if (existing?.type === parsed.data.type) {
    await prisma.replyReaction.delete({ where: { id: existing.id } });
    reacted = false;
  } else if (existing) {
    await prisma.replyReaction.update({ where: { id: existing.id }, data: { type: parsed.data.type } });
  } else {
    await prisma.replyReaction.create({ data: { replyId, userId: viewer.id, type: parsed.data.type } });
  }
  const count = await prisma.replyReaction.count({ where: { replyId } });
  return NextResponse.json({ reacted, type: reacted ? parsed.data.type : null, count });
}
