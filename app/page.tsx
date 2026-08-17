import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import GuptoNetworkApp from "@/components/GuptoNetworkApp";
import type { Post } from "@/types/social";
import type { AvatarTheme } from "@/types/current-user";
import { parseProfileWorkplaces } from "@/lib/profile-workplaces";

type DbPost = {
  id: string;
  text: string;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
    image: string | null;
    avatarTheme: string;
  };
};

const avatarThemes = new Set<AvatarTheme>(["midnight", "violet", "ocean", "mint", "sunset", "rose"]);

function toAvatarTheme(value: string): AvatarTheme {
  return avatarThemes.has(value as AvatarTheme) ? (value as AvatarTheme) : "midnight";
}

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

function formatPostTime(createdAt: Date) {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 1000));

  if (diffSeconds < 60) return "now";

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"}`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(createdAt);
}

function mapPost(post: DbPost, currentUserId: string): Post {
  const authorName = post.author.name || post.author.username || post.author.email.split("@")[0] || "User";
  const authorUsername = post.author.username || post.author.email.split("@")[0] || "user";

  return {
    id: post.id,
    initials: getInitials(authorName),
    avatarUrl: post.author.image,
    avatarTheme: toAvatarTheme(post.author.avatarTheme),
    name: authorName,
    handle: `@${authorUsername}`,
    time: formatPostTime(post.createdAt),
    text: post.text,
    visual: "none",
    liked: false,
    likeCount: 0,
    comments: "0",
    isOwn: post.author.id === currentUserId,
  };
}

const postSelect = {
  id: true,
  text: true,
  createdAt: true,
  author: {
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      avatarTheme: true,
    },
  },
} as const;

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      aboutEmail: true,
      aboutEmailVisible: true,
      phoneNumber: true,
      bio: true,
      image: true,
      coverImage: true,
      avatarTheme: true,
      location: true,
      hometown: true,
      school: true,
      college: true,
      university: true,
      relationshipStatus: true,
      gender: true,
      workplaces: true,
      interests: true,
      socialLinks: true,
      website: true,
      birthDate: true,
      category: true,
      createdAt: true,
      _count: { select: { posts: true } },
    },
  });

  if (!dbUser) {
    redirect("/login");
  }

  const [dbPosts, dbProfilePosts] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: postSelect,
    }),
    prisma.post.findMany({
      where: { authorId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: postSelect,
    }),
  ]);

  const name = dbUser.name || session.user.name || "User";
  const username = dbUser.username || dbUser.email.split("@")[0];
  const initials = getInitials(name);

  return (
    <GuptoNetworkApp
      currentUser={{
        name,
        username,
        initials,
        email: dbUser.email,
        aboutEmail: dbUser.aboutEmail || "",
        aboutEmailVisible: dbUser.aboutEmailVisible,
        phoneNumber: dbUser.phoneNumber || "",
        bio: dbUser.bio || "",
        location: dbUser.location || "",
        hometown: dbUser.hometown || "",
        school: dbUser.school || "",
        college: dbUser.college || "",
        university: dbUser.university || "",
        relationshipStatus: dbUser.relationshipStatus || "",
        gender: dbUser.gender || "",
        workplaces: parseProfileWorkplaces(dbUser.workplaces),
        interests: dbUser.interests || [],
        socialLinks: dbUser.socialLinks || [],
        website: dbUser.website || "",
        image: dbUser.image,
        coverImage: dbUser.coverImage,
        avatarTheme: toAvatarTheme(dbUser.avatarTheme),
        birthDate: dbUser.birthDate ? dbUser.birthDate.toISOString().slice(0, 10) : "",
        category: dbUser.category || "",
        joinedAt: dbUser.createdAt.toISOString(),
        postCount: dbUser._count.posts,
      }}
      initialPosts={dbPosts.map((post) => mapPost(post, dbUser.id))}
      initialProfilePosts={dbProfilePosts.map((post) => mapPost(post, dbUser.id))}
    />
  );
}
