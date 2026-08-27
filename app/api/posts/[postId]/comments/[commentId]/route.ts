import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canViewPost } from "@/lib/post-access";

const patchSchema = z.object({ text: z.string().trim().min(1).max(500), markEdited: z.boolean().optional() });

async function getViewer() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return null;
  return prisma.user.findUnique({ where: { email }, select: { id: true } });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ postId: string; commentId: string }> },
) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { postId, commentId } = await params;
  if (!(await canViewPost(postId, viewer.id))) return NextResponse.json({ error: "Post not found or unavailable." }, { status: 404 });

  const existing = await prisma.postComment.findFirst({ where: { id: commentId, postId }, select: { authorId: true } });
  if (!existing) return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  if (existing.authorId !== viewer.id) return NextResponse.json({ error: "You can only edit your own comment." }, { status: 403 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Comment must contain between 1 and 500 characters." }, { status: 400 });

  const comment = await prisma.postComment.update({
    where: { id: commentId },
    data: {
      text: parsed.data.text,
      editedAt: parsed.data.markEdited === false ? null : new Date(),
    },
    select: { id: true, text: true, editedAt: true },
  });
  return NextResponse.json({ comment: { id: comment.id, text: comment.text, wasEdited: Boolean(comment.editedAt) } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string; commentId: string }> },
) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { postId, commentId } = await params;
  if (!(await canViewPost(postId, viewer.id))) return NextResponse.json({ error: "Post not found or unavailable." }, { status: 404 });

  const existing = await prisma.postComment.findFirst({ where: { id: commentId, postId }, select: { authorId: true } });
  if (!existing) return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  if (existing.authorId !== viewer.id) return NextResponse.json({ error: "You can only delete your own comment." }, { status: 403 });

  await prisma.postComment.delete({ where: { id: commentId } });
  const count = await prisma.postComment.count({ where: { postId } });
  return NextResponse.json({ deleted: true, commentId, count });
}
