import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildVisiblePostWhere, getAcceptedFriendIds } from "@/lib/post-access";
import GuptoNetworkApp from "@/components/GuptoNetworkApp";
import type { Post, PostVisibility, ReactionType } from "@/types/social";
import type { AvatarTheme } from "@/types/current-user";
import { parseProfileWorkplaces } from "@/lib/profile-workplaces";

type DbPost = {
  id: string;
  text: string;
  visibility: PostVisibility;
  createdAt: Date;
  editedAt: Date | null;
  updatedAt: Date;
  reactions: { id: string; type: string }[];
  _count: { reactions: number; comments: number };
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

const reactionTypes = new Set<ReactionType>(["LIKE", "LOVE", "CARE", "HAHA", "WOW", "SAD", "ANGRY", "SANDAL"]);

function toReactionType(value: string | null | undefined): ReactionType | null {
  return value && reactionTypes.has(value as ReactionType) ? (value as ReactionType) : null;
}

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
    liked: post.reactions.length > 0,
    reactionType: toReactionType(post.reactions[0]?.type),
    likeCount: post._count.reactions,
    comments: String(post._count.comments),
    visibility: post.visibility,
    isOwn: post.author.id === currentUserId,
    wasEdited: Boolean(post.editedAt),
  };
}

function postSelect(currentUserId: string) {
  return {
    id: true,
    text: true,
    visibility: true,
    createdAt: true,
    updatedAt: true,
    editedAt: true,
    reactions: {
      where: { userId: currentUserId },
      select: { id: true, type: true },
      take: 1,
    },
    _count: { select: { reactions: true, comments: true } },
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
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ post?: string | string[] }>;
}) {
  const session = await auth();
  const resolvedSearchParams = await searchParams;
  const requestedPostParam = Array.isArray(resolvedSearchParams.post) ? resolvedSearchParams.post[0] : resolvedSearchParams.post;
  const requestedPostId = requestedPostParam?.trim() || "";

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
      coverPositionX: true,
      coverPositionY: true,
      coverZoom: true,
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

  const friendIds = await getAcceptedFriendIds(dbUser.id);
  const visiblePostWhere = buildVisiblePostWhere(dbUser.id, friendIds);
  const select = postSelect(dbUser.id);

  const [dbPosts, dbProfilePosts, requestedDbPost] = await Promise.all([
    prisma.post.findMany({
      where: visiblePostWhere,
      orderBy: { createdAt: "desc" },
      take: 50,
      select,
    }),
    prisma.post.findMany({
      where: { authorId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select,
    }),
    requestedPostId
      ? prisma.post.findFirst({
          where: { AND: [visiblePostWhere, { id: requestedPostId }] },
          select,
        })
      : Promise.resolve(null),
  ]);

  const feedPosts = requestedDbPost && !dbPosts.some((post) => post.id === requestedDbPost.id)
    ? [requestedDbPost, ...dbPosts]
    : dbPosts;

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
        coverPositionX: dbUser.coverPositionX,
        coverPositionY: dbUser.coverPositionY,
        coverZoom: dbUser.coverZoom,
        avatarTheme: toAvatarTheme(dbUser.avatarTheme),
        birthDate: dbUser.birthDate ? dbUser.birthDate.toISOString().slice(0, 10) : "",
        category: dbUser.category || "",
        joinedAt: dbUser.createdAt.toISOString(),
        postCount: dbUser._count.posts,
      }}
      initialPosts={feedPosts.map((post) => mapPost(post, dbUser.id))}
      initialProfilePosts={dbProfilePosts.map((post) => mapPost(post, dbUser.id))}
    />
  );
}
