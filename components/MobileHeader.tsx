import Brand from "./Brand";
import ThemeToggle from "./ThemeToggle";

type MobileHeaderProps = {
  onToggleTheme: () => void;
};

export default function MobileHeader({ onToggleTheme }: MobileHeaderProps) {
  return (
    <header className="mobile-header glass">
      <Brand />
      <div className="mobile-header-actions">
        <ThemeToggle onToggle={onToggleTheme} />
        <button className="avatar-button" aria-label="Profile"><span>RS</span></button>
      </div>
    </header>
  );
}
