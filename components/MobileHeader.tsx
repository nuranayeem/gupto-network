import type { CurrentUser } from "@/types/current-user";
import Brand from "./Brand";
import ThemeToggle from "./ThemeToggle";
import SignOutButton from "./auth/SignOutButton";
import UserAvatar from "./UserAvatar";

type MobileHeaderProps = {
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  currentUser: CurrentUser;
};

export default function MobileHeader({ onToggleTheme, onOpenProfile, currentUser }: MobileHeaderProps) {
  return (
    <header className="mobile-header glass">
      <Brand />
      <div className="mobile-header-actions">
        <ThemeToggle onToggle={onToggleTheme} />
        <SignOutButton compact />
        <button className="avatar-button" aria-label="Open profile" onClick={onOpenProfile}>
          <UserAvatar initials={currentUser.initials} image={currentUser.image} theme={currentUser.avatarTheme} className="mobile-avatar" />
        </button>
      </div>
    </header>
  );
}
