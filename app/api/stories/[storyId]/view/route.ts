import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ storyId: string }> }) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { storyId } = await params;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const story = await prisma.story.findFirst({ where: { id: storyId, expiresAt: { gt: new Date() } }, select: { id: true } });
  if (!story) return NextResponse.json({ error: "Story expired." }, { status: 404 });

  await prisma.storyView.upsert({
    where: { storyId_viewerId: { storyId, viewerId: user.id } },
    update: { viewedAt: new Date() },
    create: { storyId, viewerId: user.id },
  });
  return NextResponse.json({ viewed: true });
}
