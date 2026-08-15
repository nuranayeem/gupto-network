export type VisualType = "creative" | "quote" | "poster" | "none";

export type Post = {
  id: string;
  initials: string;
  avatarClass?: string;
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
