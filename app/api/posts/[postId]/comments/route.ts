import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canViewPost } from "@/lib/post-access";
import { serializeSocialAuthor } from "@/lib/social-author";

const commentSchema = z.object({
  text: z.string().trim().min(1).max(500),
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { postId } = await params;
  if (!(await canViewPost(postId, viewer.id))) {
    return NextResponse.json({ error: "Post not found or unavailable." }, { status: 404 });
  }

  // No artificial comment/reply cap: the database remains the source of truth.
  // The client progressively reveals the thread in small groups for readability.
  const comments = await prisma.postComment.findMany({
    where: { postId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      text: true,
      editedAt: true,
      createdAt: true,
      authorId: true,
      author: { select: authorSelect },
      _count: { select: { reactions: true } },
      reactions: {
        where: { userId: viewer.id },
        take: 1,
        select: { type: true },
      },
      replies: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          text: true,
          editedAt: true,
          createdAt: true,
          authorId: true,
          parentReplyId: true,
          author: { select: authorSelect },
          _count: { select: { reactions: true } },
          reactions: {
            where: { userId: viewer.id },
            take: 1,
            select: { type: true },
          },
        },
      },
    },
  });

  type SerializedReply = {
    id: string;
    text: string;
    createdAt: string;
    author: ReturnType<typeof serializeSocialAuthor>;
    isOwn: boolean;
    wasEdited: boolean;
    reactionType: (typeof comments)[number]["replies"][number]["reactions"][number]["type"] | null;
    reactionCount: number;
    parentReplyId: string | null;
    replies: SerializedReply[];
  };

  return NextResponse.json({
    comments: comments.map((comment) => {
      const flatReplies: SerializedReply[] = comment.replies.map((reply) => ({
        id: reply.id,
        text: reply.text,
        createdAt: reply.createdAt.toISOString(),
        author: serializeSocialAuthor(reply.author),
        isOwn: reply.authorId === viewer.id,
        wasEdited: Boolean(reply.editedAt),
        reactionType: reply.reactions[0]?.type ?? null,
        reactionCount: reply._count.reactions,
        parentReplyId: reply.parentReplyId,
        replies: [],
      }));
      const byId = new Map(flatReplies.map((reply) => [reply.id, reply]));
      const rootReplies: SerializedReply[] = [];

      for (const reply of flatReplies) {
        const parent = reply.parentReplyId ? byId.get(reply.parentReplyId) : null;
        if (parent) parent.replies.push(reply);
        else rootReplies.push(reply);
      }

      return {
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt.toISOString(),
        author: serializeSocialAuthor(comment.author),
        isOwn: comment.authorId === viewer.id,
        wasEdited: Boolean(comment.editedAt),
        reactionType: comment.reactions[0]?.type ?? null,
        reactionCount: comment._count.reactions,
        replies: rootReplies,
      };
    }),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { postId } = await params;
  if (!(await canViewPost(postId, viewer.id))) {
    return NextResponse.json({ error: "Post not found or unavailable." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Comment must contain between 1 and 500 characters." }, { status: 400 });
  }

  const comment = await prisma.postComment.create({
    data: { postId, authorId: viewer.id, text: parsed.data.text },
    select: {
      id: true,
      text: true,
      createdAt: true,
      author: { select: authorSelect },
    },
  });

  const count = await prisma.postComment.count({ where: { postId } });

  return NextResponse.json(
    {
      comment: {
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt.toISOString(),
        author: serializeSocialAuthor(comment.author),
        isOwn: true,
        wasEdited: false,
        reactionType: null,
        reactionCount: 0,
        replies: [],
      },
      count,
    },
    { status: 201 },
  );
}
