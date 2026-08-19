import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canViewPost } from "@/lib/post-access";

const patchSchema = z.object({ text: z.string().trim().min(1).max(500) });

async function getViewer() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return null;
  return prisma.user.findUnique({ where: { email }, select: { id: true } });
}

async function getOwnedReply(postId: string, commentId: string, replyId: string, viewerId: string) {
  const reply = await prisma.postReply.findFirst({
    where: { id: replyId, commentId, comment: { postId } },
    select: { authorId: true },
  });
  if (!reply) return { error: NextResponse.json({ error: "Reply not found." }, { status: 404 }) };
  if (reply.authorId !== viewerId) return { error: NextResponse.json({ error: "You can only manage your own reply." }, { status: 403 }) };
  return { reply };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ postId: string; commentId: string; replyId: string }> },
) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { postId, commentId, replyId } = await params;
  if (!(await canViewPost(postId, viewer.id))) return NextResponse.json({ error: "Post not found or unavailable." }, { status: 404 });

  const owned = await getOwnedReply(postId, commentId, replyId, viewer.id);
  if ("error" in owned) return owned.error;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Reply must contain between 1 and 500 characters." }, { status: 400 });

  const reply = await prisma.postReply.update({
    where: { id: replyId },
    data: { text: parsed.data.text, editedAt: new Date() },
    select: { id: true, text: true, editedAt: true },
  });
  return NextResponse.json({ reply: { id: reply.id, text: reply.text, wasEdited: Boolean(reply.editedAt) } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string; commentId: string; replyId: string }> },
) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { postId, commentId, replyId } = await params;
  if (!(await canViewPost(postId, viewer.id))) return NextResponse.json({ error: "Post not found or unavailable." }, { status: 404 });

  const owned = await getOwnedReply(postId, commentId, replyId, viewer.id);
  if ("error" in owned) return owned.error;
  await prisma.postReply.delete({ where: { id: replyId } });
  return NextResponse.json({ deleted: true, replyId });
}
