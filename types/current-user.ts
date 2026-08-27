export type AvatarTheme = "midnight" | "violet" | "ocean" | "mint" | "sunset" | "rose";

export type ProfileWorkplace = {
  name: string;
  url: string;
};

export type CurrentUser = {
  name: string;
  username: string;
  initials: string;
  email: string;
  aboutEmail: string;
  aboutEmailVisible: boolean;
  phoneNumber: string;
  bio: string;
  location: string;
  hometown: string;
  school: string;
  college: string;
  university: string;
  relationshipStatus: string;
  gender: string;
  workplaces: ProfileWorkplace[];
  interests: string[];
  socialLinks: string[];
  website: string;
  image: string | null;
  coverImage: string | null;
  coverPositionX: number;
  coverPositionY: number;
  coverZoom: number;
  avatarTheme: AvatarTheme;
  birthDate: string;
  category: string;
  joinedAt: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
};
