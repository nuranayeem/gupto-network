import type { CurrentUser } from "@/types/current-user";
import Brand from "./Brand";

type SidebarProps = {
  onFocusComposer: () => void;
  currentUser: CurrentUser;
};

export default function Sidebar({ onFocusComposer, currentUser }: SidebarProps) {
  return (
    <aside className="sidebar glass">
      <div>
        <Brand desktop />

        <nav className="main-nav" aria-label="Primary navigation">
          <a className="nav-item active" href="#home">
            <svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z"/></svg>
            <span>Home</span>
          </a>
          <a className="nav-item" href="#discover">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z"/></svg>
            <span>Discover</span>
          </a>
          <a className="nav-item" href="#messages">
            <svg viewBox="0 0 24 24"><path d="M21 14a4 4 0 0 1-4 4H9l-6 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7Z"/></svg>
            <span>Messages</span>
            <span className="nav-badge">4</span>
          </a>
          <a className="nav-item" href="#notifications">
            <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
            <span>Notifications</span>
            <span className="status-dot"></span>
          </a>
          <a className="nav-item" href="#bookmarks">
            <svg viewBox="0 0 24 24"><path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z"/></svg>
            <span>Bookmarks</span>
          </a>
          <a className="nav-item" href="#profile">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
            <span>Profile</span>
          </a>
        </nav>

        <button className="create-btn" id="focusComposerBtn" onClick={onFocusComposer}>
          <span>+</span>
          Create post
        </button>
      </div>

      <div className="sidebar-footer">
        <button className="profile-chip">
          <span className="profile-avatar">{currentUser.initials}</span>
          <span className="profile-meta">
            <strong>{currentUser.name}</strong>
            <small>@{currentUser.username}</small>
          </span>
          <span className="profile-more">•••</span>
        </button>
      </div>
    </aside>
  );
}
