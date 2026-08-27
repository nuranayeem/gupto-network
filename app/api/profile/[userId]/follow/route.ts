import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { userId: followingId } = await params;
  const follower = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!follower) return NextResponse.json({ error: "User account not found." }, { status: 401 });
  if (follower.id === followingId) {
    return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: follower.id, followingId } },
    select: { id: true },
  });

  const following = await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.follow.delete({ where: { id: existing.id } });
      return false;
    }

    await tx.follow.create({ data: { followerId: follower.id, followingId } });
    return true;
  });

  const followerCount = await prisma.follow.count({ where: { followingId } });
  return NextResponse.json({ following, followerCount });
}
