type MobileNavProps = {
  onFocusComposer: () => void;
};

export default function MobileNav({ onFocusComposer }: MobileNavProps) {
  return (
    <nav className="mobile-nav glass" aria-label="Mobile navigation">
      <a className="mobile-nav-item active" href="#home" aria-label="Home"><svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z"/></svg></a>
      <a className="mobile-nav-item" href="#discover" aria-label="Discover"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z"/></svg></a>
      <button className="mobile-create" id="mobileComposerBtn" aria-label="Create post" onClick={onFocusComposer}>+</button>
      <a className="mobile-nav-item" href="#messages" aria-label="Messages"><svg viewBox="0 0 24 24"><path d="M21 14a4 4 0 0 1-4 4H9l-6 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7Z"/></svg></a>
      <a className="mobile-nav-item" href="#profile" aria-label="Profile"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></a>
    </nav>
  );
}
