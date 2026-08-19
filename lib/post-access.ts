import { prisma } from "@/lib/prisma";

export async function getAcceptedFriendIds(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: {
      requesterId: true,
      addresseeId: true,
    },
  });

  return friendships.map((friendship) =>
    friendship.requesterId === userId ? friendship.addresseeId : friendship.requesterId,
  );
}

export function buildVisiblePostWhere(userId: string, friendIds: string[]) {
  return {
    OR: [
      { authorId: userId },
      { visibility: "PUBLIC" as const },
      ...(friendIds.length
        ? [{ visibility: "FRIENDS" as const, authorId: { in: friendIds } }]
        : []),
    ],
  };
}

export async function canViewPost(postId: string, userId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, visibility: true },
  });

  if (!post) return false;
  if (post.authorId === userId || post.visibility === "PUBLIC") return true;
  if (post.visibility === "PRIVATE") return false;

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: userId, addresseeId: post.authorId },
        { requesterId: post.authorId, addresseeId: userId },
      ],
    },
    select: { id: true },
  });

  return Boolean(friendship);
}
