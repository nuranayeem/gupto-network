import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { removeStoryMediaUrl } from "@/lib/story-media";

export async function DELETE(_request: Request, { params }: { params: Promise<{ storyId: string }> }) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { storyId } = await params;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const story = await prisma.story.findFirst({ where: { id: storyId, authorId: user.id }, select: { id: true, mediaUrl: true, audioUrl: true } });
  if (!story) return NextResponse.json({ error: "Story not found." }, { status: 404 });

  await prisma.story.delete({ where: { id: story.id } });
  await Promise.all([removeStoryMediaUrl(user.id, story.mediaUrl), removeStoryMediaUrl(user.id, story.audioUrl)]);
  return NextResponse.json({ deleted: true });
}
