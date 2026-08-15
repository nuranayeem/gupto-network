import type { CurrentUser } from "@/types/current-user";
import Brand from "./Brand";
import ThemeToggle from "./ThemeToggle";

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
        <button className="avatar-button" aria-label="Profile"><span>{currentUser.initials}</span></button>
      </div>
    </header>
  );
}
