import type { AvatarTheme } from "./current-user";

export type StoryMediaType = "PHOTO" | "VIDEO" | "MUSIC" | "PHOTO_MUSIC";
export type StoryAudience = "PUBLIC" | "FOLLOWERS" | "PRIVATE";
export type StoryCaptionPosition = "TOP" | "BOTTOM" | "LEFT" | "CENTER" | "RIGHT" | "CUSTOM";
export type StoryCaptionStyle = {
  font: "MODERN" | "CLASSIC" | "POPPINS" | "SOCIAL" | "ROUNDED" | "ELEGANT" | "LUXURY" | "CREATOR" | "HANDWRITTEN" | "PLAYFUL" | "MONO";
  size: "SMALL" | "MEDIUM" | "LARGE";
  fontSize: number;
  align: "LEFT" | "CENTER" | "RIGHT";
  bold: boolean;
  italic: boolean;
  color: string;
  background: "NONE" | "GLASS" | "SOLID";
  backgroundColor: string;
  position: StoryCaptionPosition;
  offsetX: number;
  offsetY: number;
  rotation: number;
};

export const DEFAULT_STORY_CAPTION_STYLE: StoryCaptionStyle = {
  font: "MODERN",
  size: "MEDIUM",
  fontSize: 17,
  align: "CENTER",
  bold: true,
  italic: false,
  color: "#ffffff",
  background: "NONE",
  backgroundColor: "#171922",
  position: "BOTTOM",
  offsetX: 50,
  offsetY: 82,
  rotation: 0,
};

export type StoryMediaTransform = {
  scale: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  offsetX: number;
  offsetY: number;
  fit: "COVER" | "CONTAIN";
  frame: "PORTRAIT" | "SQUARE" | "LANDSCAPE";
};

export const DEFAULT_STORY_MEDIA_TRANSFORM: StoryMediaTransform = {
  scale: 1,
  rotation: 0,
  flipX: false,
  flipY: false,
  offsetX: 0,
  offsetY: 0,
  fit: "CONTAIN",
  frame: "PORTRAIT",
};

export type StoryItem = {
  id: string;
  mediaType: StoryMediaType;
  mediaUrl: string | null;
  audioUrl: string | null;
  audioStartSeconds: number;
  audioDurationSeconds: number;
  backgroundColors: [string, string, string];
  mediaTransform: StoryMediaTransform;
  caption: string;
  captionStyle: StoryCaptionStyle;
  musicTitle: string;
  accent: string;
  audience: StoryAudience;
  durationSeconds: number;
  allowReplies: boolean;
  createdAt: string;
  expiresAt: string;
  viewed: boolean;
  viewCount: number;
};

export type StoryBundle = {
  author: {
    id: string;
    name: string;
    username: string;
    initials: string;
    image: string | null;
    avatarTheme: AvatarTheme;
    isOwn: boolean;
  };
  stories: StoryItem[];
  hasUnseen: boolean;
  latestPreview: string | null;
  latestAccent: string;
};
