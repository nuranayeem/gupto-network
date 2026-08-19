import type { AvatarTheme } from "./current-user";

export type VisualType = "creative" | "quote" | "poster" | "none";
export type PostVisibility = "PUBLIC" | "FRIENDS" | "PRIVATE";
export type ReactionType = "LIKE" | "LOVE" | "CARE" | "HAHA" | "WOW" | "SAD" | "ANGRY" | "SANDAL";

export type SocialAuthor = {
  id: string;
  initials: string;
  name: string;
  handle: string;
  avatarUrl?: string | null;
  avatarTheme?: AvatarTheme;
};

export type PostReply = {
  id: string;
  text: string;
  createdAt: string;
  author: SocialAuthor;
  isOwn: boolean;
  wasEdited?: boolean;
  reactionType?: ReactionType | null;
  reactionCount: number;
  parentReplyId?: string | null;
  replies: PostReply[];
};

export type PostComment = {
  id: string;
  text: string;
  createdAt: string;
  author: SocialAuthor;
  isOwn: boolean;
  wasEdited?: boolean;
  reactionType?: ReactionType | null;
  reactionCount: number;
  replies: PostReply[];
};

export type Post = {
  id: string;
  initials: string;
  avatarClass?: string;
  avatarUrl?: string | null;
  avatarTheme?: AvatarTheme;
  name: string;
  handle: string;
  time: string;
  verified?: boolean;
  text: string;
  visual: VisualType;
  liked: boolean;
  reactionType?: ReactionType | null;
  likeCount: number;
  displayLikeCount?: string;
  comments: string;
  visibility: PostVisibility;
  isOwn?: boolean;
  wasEdited?: boolean;
};
