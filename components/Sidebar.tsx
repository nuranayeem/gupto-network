import type { CurrentUser } from "@/types/current-user";
import Brand from "./Brand";
import SignOutButton from "./auth/SignOutButton";
import UserAvatar from "./UserAvatar";

type SidebarProps = {
  onFocusComposer: () => void;
  currentUser: CurrentUser;
  activeSection: string;
};

export default function Sidebar({ onFocusComposer, currentUser, activeSection }: SidebarProps) {
  return (
    <aside className="sidebar glass">
      <div>
        <Brand desktop />

        <nav className="main-nav" aria-label="Primary navigation">
          <a className={`nav-item${activeSection === "home" ? " active" : ""}`} href="#home">
            <svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z"/></svg>
            <span>Home</span>
          </a>
          <a className={`nav-item${activeSection === "discover" ? " active" : ""}`} href="#discover">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z"/></svg>
            <span>Discover</span>
          </a>
          <a className={`nav-item${activeSection === "messages" ? " active" : ""}`} href="#messages">
            <svg viewBox="0 0 24 24"><path d="M21 14a4 4 0 0 1-4 4H9l-6 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7Z"/></svg>
            <span>Messages</span>
            <span className="nav-badge">4</span>
          </a>
          <a className={`nav-item${activeSection === "notifications" ? " active" : ""}`} href="#notifications">
            <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
            <span>Notifications</span>
            <span className="status-dot"></span>
          </a>
          <a className={`nav-item${activeSection === "bookmarks" ? " active" : ""}`} href="#bookmarks">
            <svg viewBox="0 0 24 24"><path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z"/></svg>
            <span>Bookmarks</span>
          </a>
          <a className={`nav-item${activeSection === "profile" ? " active" : ""}`} href="#profile">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
            <span>Profile</span>
          </a>

          <a className={`nav-item${activeSection === "feed-control" ? " active" : ""}`} href="#feed-control">
            <svg viewBox="0 0 24 24"><path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/><path d="M4 12h5"/><path d="M13 12h7"/><circle cx="11" cy="12" r="2"/></svg>
            <span>Feed Control</span>
          </a>
          <a className={`nav-item${activeSection === "requests" ? " active" : ""}`} href="#requests">
            <svg viewBox="0 0 24 24"><path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M9 2h6v4H9z"/><path d="M9 11h6"/><path d="M9 15h4"/></svg>
            <span>Requests</span>
          </a>
          <a className={`nav-item${activeSection === "circles" ? " active" : ""}`} href="#circles">
            <svg viewBox="0 0 24 24"><circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10.5" r="2.5"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M14 16.5a4.5 4.5 0 0 1 6.5 3.5"/></svg>
            <span>Circles</span>
          </a>
          <a className={`nav-item${activeSection === "settings" ? " active" : ""}`} href="#settings">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4h-.1A1.7 1.7 0 0 0 19.4 15Z"/></svg>
            <span>Settings</span>
          </a>
        </nav>

        <button className="create-btn" id="focusComposerBtn" onClick={onFocusComposer}>
          <span>+</span>
          Create post
        </button>
      </div>

      <div className="sidebar-footer">
        <details className="profile-actions">
          <summary
            className="profile-chip"
            aria-label="Open account menu"
            title="Account options"
          >
            <UserAvatar initials={currentUser.initials} image={currentUser.image} theme={currentUser.avatarTheme} />
            <span className="profile-meta">
              <strong>{currentUser.name}</strong>
              <small>@{currentUser.username}</small>
            </span>
            <span className="profile-more" aria-hidden="true">•••</span>
          </summary>

          <div className="profile-menu" role="menu" aria-label="Account menu">
            <SignOutButton />
          </div>
        </details>
      </div>
    </aside>
  );
}
