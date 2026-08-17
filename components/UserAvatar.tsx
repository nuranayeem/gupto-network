import type { AvatarTheme } from "@/types/current-user";

type UserAvatarProps = {
  initials: string;
  image?: string | null;
  theme?: AvatarTheme;
  className?: string;
  alt?: string;
};

export default function UserAvatar({ initials, image, theme = "midnight", className = "profile-avatar", alt = "Profile" }: UserAvatarProps) {
  const classes = `${className} avatar-theme-${theme}${image ? " has-photo" : ""}`;

  return (
    <span className={classes} aria-label={alt}>
      {image ? (
        <>
          <img className="avatar-photo-bg" src={image} alt="" aria-hidden="true" />
          <img className="avatar-photo-main" src={image} alt="" />
        </>
      ) : initials}
    </span>
  );
}
