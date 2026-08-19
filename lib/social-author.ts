import type { AvatarTheme } from "@/types/current-user";

const avatarThemes = new Set<AvatarTheme>(["midnight", "violet", "ocean", "mint", "sunset", "rose"]);

export function toAvatarTheme(value: string): AvatarTheme {
  return avatarThemes.has(value as AvatarTheme) ? (value as AvatarTheme) : "midnight";
}

export function getInitials(name: string) {
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

export function serializeSocialAuthor(user: {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  image: string | null;
  avatarTheme: string;
}) {
  const name = user.name || user.username || user.email.split("@")[0] || "User";
  const username = user.username || user.email.split("@")[0] || "user";

  return {
    id: user.id,
    initials: getInitials(name),
    name,
    handle: `@${username}`,
    avatarUrl: user.image,
    avatarTheme: toAvatarTheme(user.avatarTheme),
  };
}
