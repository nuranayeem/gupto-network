import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createPostSchema = z.object({
  text: z.string().trim().min(1).max(280),
});

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

export async function POST(request: Request) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createPostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Post must contain between 1 and 280 characters." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      image: true,
      avatarTheme: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User account not found." }, { status: 401 });
  }

  const createdPost = await prisma.post.create({
    data: {
      authorId: user.id,
      text: parsed.data.text,
    },
    select: {
      id: true,
      text: true,
    },
  });

  const name = user.name || user.username || user.email.split("@")[0] || "User";
  const username = user.username || user.email.split("@")[0] || "user";

  return NextResponse.json(
    {
      post: {
        id: createdPost.id,
        initials: getInitials(name),
        avatarUrl: user.image,
        avatarTheme: user.avatarTheme,
        name,
        handle: `@${username}`,
        time: "now",
        text: createdPost.text,
        visual: "none",
        liked: false,
        likeCount: 0,
        comments: "0",
        isOwn: true,
      },
    },
    { status: 201 }
  );
}
