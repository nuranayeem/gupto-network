import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canViewPost } from "@/lib/post-access";
import { serializeSocialAuthor } from "@/lib/social-author";

const replySchema = z.object({
  text: z.string().trim().min(1).max(500),
  parentReplyId: z.string().trim().min(1).nullable().optional(),
});

const authorSelect = {
  id: true,
  email: true,
  username: true,
  name: true,
  image: true,
  avatarTheme: true,
} as const;

async function getViewer() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return null;
  return prisma.user.findUnique({ where: { email }, select: { id: true } });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string; commentId: string }> },
) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { postId, commentId } = await params;
  if (!(await canViewPost(postId, viewer.id))) {
    return NextResponse.json({ error: "Post not found or unavailable." }, { status: 404 });
  }

  const comment = await prisma.postComment.findFirst({
    where: { id: commentId, postId },
    select: { id: true },
  });
  if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Reply must contain between 1 and 500 characters." }, { status: 400 });
  }

  const parentReplyId = parsed.data.parentReplyId ?? null;
  if (parentReplyId) {
    const parent = await prisma.postReply.findFirst({
      where: { id: parentReplyId, commentId, comment: { postId } },
      select: { id: true },
    });
    if (!parent) return NextResponse.json({ error: "Reply target not found." }, { status: 404 });
  }

  const reply = await prisma.postReply.create({
    data: { commentId, authorId: viewer.id, parentReplyId, text: parsed.data.text },
    select: {
      id: true,
      text: true,
      parentReplyId: true,
      createdAt: true,
      author: { select: authorSelect },
    },
  });

  return NextResponse.json(
    {
      reply: {
        id: reply.id,
        text: reply.text,
        createdAt: reply.createdAt.toISOString(),
        author: serializeSocialAuthor(reply.author),
        isOwn: true,
        wasEdited: false,
        reactionType: null,
        reactionCount: 0,
        parentReplyId: reply.parentReplyId,
        replies: [],
      },
    },
    { status: 201 },
  );
}
