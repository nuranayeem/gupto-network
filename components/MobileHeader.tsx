import type { CurrentUser } from "@/types/current-user";
import Brand from "./Brand";
import ThemeToggle from "./ThemeToggle";
import SignOutButton from "./auth/SignOutButton";

type MobileHeaderProps = {
  onToggleTheme: () => void;
  currentUser: CurrentUser;
};

export default function MobileHeader({ onToggleTheme, currentUser }: MobileHeaderProps) {
  return (
    <header className="mobile-header glass">
      <Brand />
      <div className="mobile-header-actions">
        <ThemeToggle onToggle={onToggleTheme} />
        <SignOutButton compact />
        <button className="avatar-button" aria-label="Profile"><span>{currentUser.initials}</span></button>
      </div>
    </header>
  );
}
