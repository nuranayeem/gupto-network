import type { RefObject } from "react";

type RightPanelProps = {
  searchRef: RefObject<HTMLInputElement | null>;
  following: Set<string>;
  onToggleFollow: (name: string) => void;
};

const people = [
  { initials: "ZR", avatarClass: "avatar-blue", name: "Zara Reed", role: "Product designer" },
  { initials: "LU", avatarClass: "avatar-pink", name: "Lucas Uno", role: "Motion artist" },
  { initials: "NS", avatarClass: "avatar-yellow", name: "Nila Sen", role: "Creative coder" },
];

export default function RightPanel({ searchRef, following, onToggleFollow }: RightPanelProps) {
  return (
    <aside className="right-panel">
      <div className="search-box glass">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
        <input ref={searchRef} type="search" placeholder="Search Nexora" aria-label="Search Nexora" />
        <kbd>⌘K</kbd>
      </div>

      <section className="side-card card" id="discover">
        <div className="side-card-header">
          <div>
            <span className="eyebrow">DISCOVER</span>
            <h2>Trending now</h2>
          </div>
          <button className="text-btn">See all</button>
        </div>
        <div className="trend-list">
          <a href="#" className="trend-item">
            <div><small>Design · Trending</small><strong>#QuietInterfaces</strong><span>12.4K posts</span></div><span>↗</span>
          </a>
          <a href="#" className="trend-item">
            <div><small>Technology · Popular</small><strong>Spatial computing</strong><span>8.9K posts</span></div><span>↗</span>
          </a>
          <a href="#" className="trend-item">
            <div><small>Culture · Rising</small><strong>#DigitalMinimalism</strong><span>6.2K posts</span></div><span>↗</span>
          </a>
        </div>
      </section>

      <section className="side-card card">
        <div className="side-card-header">
          <div>
            <span className="eyebrow">PEOPLE</span>
            <h2>Worth following</h2>
          </div>
        </div>
        <div className="people-list">
          {people.map((person) => {
            const isFollowing = following.has(person.name);
            return (
              <div className="person-row" key={person.name}>
                <span className={`avatar ${person.avatarClass}`}>{person.initials}</span>
                <div className="person-meta"><strong>{person.name}</strong><small>{person.role}</small></div>
                <button className={`follow-btn${isFollowing ? " following" : ""}`} onClick={() => onToggleFollow(person.name)}>
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="tiny-footer">
        <a href="#">About</a><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Help</a>
        <span>© 2026 NEXORA</span>
      </footer>
    </aside>
  );
}
