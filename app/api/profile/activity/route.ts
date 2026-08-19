import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildVisiblePostWhere, getAcceptedFriendIds } from "@/lib/post-access";

export async function GET(request: Request) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const viewer = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!viewer) return NextResponse.json({ error: "User account not found." }, { status: 401 });

  const type = new URL(request.url).searchParams.get("type");
  if (!type || !["react", "comment", "reply"].includes(type)) {
    return NextResponse.json({ error: "Invalid activity type." }, { status: 400 });
  }

  const friendIds = await getAcceptedFriendIds(viewer.id);
  const visiblePostWhere = buildVisiblePostWhere(viewer.id, friendIds);

  if (type === "react") {
    const reactions = await prisma.postReaction.findMany({
      where: { userId: viewer.id, post: { is: visiblePostWhere } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        type: true,
        createdAt: true,
        post: {
          select: {
            id: true,
            text: true,
            author: { select: { name: true, username: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({
      items: reactions.map((reaction) => ({
        id: reaction.id,
        kind: "react",
        label: reaction.type,
        text: reaction.post.text,
        createdAt: reaction.createdAt.toISOString(),
        postId: reaction.post.id,
        postAuthor: reaction.post.author.name || reaction.post.author.username || reaction.post.author.email.split("@")[0] || "User",
      })),
    });
  }

  if (type === "comment") {
    const comments = await prisma.postComment.findMany({
      where: { authorId: viewer.id, post: { is: visiblePostWhere } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        text: true,
        createdAt: true,
        post: {
          select: {
            id: true,
            text: true,
            author: { select: { name: true, username: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({
      items: comments.map((comment) => ({
        id: comment.id,
        kind: "comment",
        label: "Comment",
        text: comment.text,
        context: comment.post.text,
        createdAt: comment.createdAt.toISOString(),
        postId: comment.post.id,
        postAuthor: comment.post.author.name || comment.post.author.username || comment.post.author.email.split("@")[0] || "User",
      })),
    });
  }

  const replies = await prisma.postReply.findMany({
    where: { authorId: viewer.id, comment: { is: { post: { is: visiblePostWhere } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      text: true,
      createdAt: true,
      comment: {
        select: {
          text: true,
          post: {
            select: {
              id: true,
              text: true,
              author: { select: { name: true, username: true, email: true } },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    items: replies.map((reply) => ({
      id: reply.id,
      kind: "reply",
      label: "Reply",
      text: reply.text,
      context: reply.comment.text,
      postContext: reply.comment.post.text,
      createdAt: reply.createdAt.toISOString(),
      postId: reply.comment.post.id,
      postAuthor: reply.comment.post.author.name || reply.comment.post.author.username || reply.comment.post.author.email.split("@")[0] || "User",
    })),
  });
}
