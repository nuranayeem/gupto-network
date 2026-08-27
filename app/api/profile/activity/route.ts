import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildVisiblePostWhere, getAcceptedFriendIds } from "@/lib/post-access";
import { serializeSocialAuthor } from "@/lib/social-author";

export async function GET(request: Request) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const viewer = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!viewer) return NextResponse.json({ error: "User account not found." }, { status: 401 });

  const searchParams = new URL(request.url).searchParams;
  const type = searchParams.get("type");
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");

  const from = fromRaw ? new Date(fromRaw) : null;
  const to = toRaw ? new Date(toRaw) : null;
  if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
    return NextResponse.json({ error: "Invalid activity date range." }, { status: 400 });
  }
  if (from && to && from >= to) {
    return NextResponse.json({ error: "Activity date range is invalid." }, { status: 400 });
  }

  const createdAt = from || to
    ? { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) }
    : undefined;
  if (!type || !["react", "comment", "reply"].includes(type)) {
    return NextResponse.json({ error: "Invalid activity type." }, { status: 400 });
  }

  const friendIds = await getAcceptedFriendIds(viewer.id);
  const visiblePostWhere = buildVisiblePostWhere(viewer.id, friendIds);

  if (type === "react") {
    const reactions = await prisma.postReaction.findMany({
      where: { userId: viewer.id, post: { is: visiblePostWhere }, ...(createdAt ? { createdAt } : {}) },
      orderBy: { createdAt: "desc" },
      ...(createdAt ? {} : { take: 100 }),
      select: {
        id: true,
        type: true,
        createdAt: true,
        post: {
          select: {
            id: true,
            text: true,
            author: { select: { id: true, name: true, username: true, email: true, image: true, avatarTheme: true } },
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
        postAuthorProfile: serializeSocialAuthor(reaction.post.author),
      })),
    });
  }

  if (type === "comment") {
    const comments = await prisma.postComment.findMany({
      where: { authorId: viewer.id, post: { is: visiblePostWhere }, ...(createdAt ? { createdAt } : {}) },
      orderBy: { createdAt: "desc" },
      ...(createdAt ? {} : { take: 100 }),
      select: {
        id: true,
        text: true,
        createdAt: true,
        post: {
          select: {
            id: true,
            text: true,
            author: { select: { id: true, name: true, username: true, email: true, image: true, avatarTheme: true } },
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
        postAuthorProfile: serializeSocialAuthor(comment.post.author),
      })),
    });
  }

  const replies = await prisma.postReply.findMany({
    where: { authorId: viewer.id, comment: { is: { post: { is: visiblePostWhere } } }, ...(createdAt ? { createdAt } : {}) },
    orderBy: { createdAt: "desc" },
    ...(createdAt ? {} : { take: 100 }),
    select: {
      id: true,
      commentId: true,
      text: true,
      createdAt: true,
      comment: {
        select: {
          text: true,
          post: {
            select: {
              id: true,
              text: true,
              author: { select: { id: true, name: true, username: true, email: true, image: true, avatarTheme: true } },
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
      commentId: reply.commentId,
      label: "Reply",
      text: reply.text,
      context: reply.comment.text,
      postContext: reply.comment.post.text,
      createdAt: reply.createdAt.toISOString(),
      postId: reply.comment.post.id,
      postAuthor: reply.comment.post.author.name || reply.comment.post.author.username || reply.comment.post.author.email.split("@")[0] || "User",
      postAuthorProfile: serializeSocialAuthor(reply.comment.post.author),
    })),
  });
}
