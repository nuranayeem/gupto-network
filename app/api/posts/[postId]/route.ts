import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const patchPostSchema = z
  .object({
    text: z.string().trim().min(1).max(280).optional(),
    visibility: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).optional(),
  })
  .refine((value) => value.text !== undefined || value.visibility !== undefined, {
    message: "Nothing to update.",
  });

async function getViewer() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return null;
  return prisma.user.findUnique({ where: { email }, select: { id: true } });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { postId } = await params;
  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!existing) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  if (existing.authorId !== viewer.id) {
    return NextResponse.json({ error: "You can only update your own post." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid post update." }, { status: 400 });
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      ...(parsed.data.text !== undefined ? { text: parsed.data.text, editedAt: new Date() } : {}),
      ...(parsed.data.visibility !== undefined ? { visibility: parsed.data.visibility } : {}),
    },
    select: { id: true, text: true, visibility: true, editedAt: true },
  });

  return NextResponse.json({
    post: {
      id: updated.id,
      text: updated.text,
      visibility: updated.visibility,
      wasEdited: Boolean(updated.editedAt),
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { postId } = await params;
  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!existing) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  if (existing.authorId !== viewer.id) {
    return NextResponse.json({ error: "You can only delete your own post." }, { status: 403 });
  }

  await prisma.post.delete({ where: { id: postId } });
  return NextResponse.json({ deleted: true, postId });
}
