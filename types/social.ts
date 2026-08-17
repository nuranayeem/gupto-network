import type { AvatarTheme } from "./current-user";

export type VisualType = "creative" | "quote" | "poster" | "none";

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
  likeCount: number;
  displayLikeCount?: string;
  comments: string;
  isOwn?: boolean;
};
