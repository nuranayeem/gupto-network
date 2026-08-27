import { useEffect, useRef, type ChangeEvent, type MouseEvent as ReactMouseEvent, type RefObject } from "react";
import type { Post } from "@/types/social";
import type { CurrentUser } from "@/types/current-user";
import ThemeToggle from "./ThemeToggle";
import Stories from "./Stories";
import Composer from "./Composer";
import PostCard from "./PostCard";

type FeedProps = {
  posts: Post[];
  bookmarks: Set<string>;
  composerValue: string;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  activeFilter: "for-you" | "following";
  currentUser: CurrentUser;
  onToggleTheme: () => void;
  onComposerChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onPublish: () => void;
  isPublishing: boolean;
  onToggleLike: (id: string) => Promise<void> | void;
  onToggleBookmark: (id: string) => void;
  onPostUpdated: (id: string, changes: Partial<Post>) => void;
  onPostDeleted: (id: string) => void;
  onCommentCountChange: (id: string, count: number) => void;
  onShowToast: (message: string) => void;
  onFilterChange: (filter: "for-you" | "following") => void;
  onOwnStoryStatusChange: (active: boolean) => void;
};

export default function Feed({
  posts,
  bookmarks,
  composerValue,
  composerRef,
  activeFilter,
  currentUser,
  onToggleTheme,
  onComposerChange,
  onPublish,
  isPublishing,
  onToggleLike,
  onToggleBookmark,
  onPostUpdated,
  onPostDeleted,
  onCommentCountChange,
  onShowToast,
  onFilterChange,
  onOwnStoryStatusChange,
}: FeedProps) {
  const categoryTopbarRef = useRef<HTMLElement | null>(null);
  const categoryBarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const topbar = categoryTopbarRef.current;
    const categories = categoryBarRef.current;
    if (!topbar || !categories) return;

    const handleCategoryWheel = (event: WheelEvent) => {
      event.preventDefault();
      categories.scrollLeft += event.deltaY !== 0 ? event.deltaY : event.deltaX;
    };

    topbar.addEventListener("wheel", handleCategoryWheel, { passive: false });
    return () => topbar.removeEventListener("wheel", handleCategoryWheel);
  }, []);

  const handleCategoryClick = (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    const categories = categoryBarRef.current;
    const selected = (event.target as HTMLElement).closest<HTMLElement>(".home-category");
    if (!categories || !selected) return;

    const next = selected?.nextElementSibling as HTMLElement | null;
    const previous = selected?.previousElementSibling as HTMLElement | null;

    const trackBounds = categories.getBoundingClientRect();
    const nextBounds = next?.getBoundingClientRect();
    const previousBounds = previous?.getBoundingClientRect();

    if (nextBounds && nextBounds.right > trackBounds.right) {
      categories.scrollBy({
        left: nextBounds.right - trackBounds.right + 10,
        behavior: "smooth",
      });
      return;
    }

    if (previousBounds && previousBounds.left < trackBounds.left) {
      categories.scrollBy({
        left: previousBounds.left - trackBounds.left - 10,
        behavior: "smooth",
      });
    }
  };

  const resetCategories = (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    categoryBarRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  };

  return (
    <main className="feed" id="home">
      <section
        ref={categoryTopbarRef}
        className="feed-topbar feed-topbar-categories"
        aria-label="Content categories and quick actions"
      >
        <div className="home-categories card" aria-label="Browse content categories">
          <a className="home-category home-category-fixed active" href="#postsContainer" onClick={resetCategories}>
            <svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>
            <span>All</span>
          </a>
          <nav ref={categoryBarRef} className="home-category-track" aria-label="More content categories" onClick={handleCategoryClick}>
            <a className="home-category" href="#postsContainer">
            <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="15" rx="3"/><path d="m8 5 3 4M14 5l3 4M9.5 12.5l5 2.5-5 2.5v-5Z"/></svg>
            <span>Reels</span>
          </a>
            <a className="home-category" href="#postsContainer">
            <svg viewBox="0 0 24 24"><path d="M5 4h14v16H5z"/><path d="M8 8h5M8 12h8M8 16h8M16 8h.01"/></svg>
            <span>News</span>
          </a>
            <a className="home-category" href="#postsContainer">
            <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2"/><path d="M3 20c0-4 2.5-6 6-6s6 2 6 6M14 15c3.5-.8 6 1.2 6 5"/></svg>
            <span>Creators</span>
          </a>
            <a className="home-category" href="#postsContainer">
            <svg viewBox="0 0 24 24"><path d="m4 16 5-5 4 4 7-8"/><path d="M15 7h5v5"/></svg>
            <span>Trending</span>
          </a>
            <a className="home-category" href="#postsContainer">
            <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="8.5" cy="10" r="1.5"/><path d="m5 17 5-5 3.5 3 2.5-2 3 4"/></svg>
            <span>Photos</span>
          </a>
            <a className="home-category" href="#postsContainer">
            <svg viewBox="0 0 24 24"><path d="M8 8h8a5 5 0 0 1 4.7 6.7l-1 2.8a2 2 0 0 1-3.3.8L14 16h-4l-2.4 2.3a2 2 0 0 1-3.3-.8l-1-2.8A5 5 0 0 1 8 8Z"/><path d="M8 11v4M6 13h4M16 12h.01M18 14h.01"/></svg>
            <span>Gaming</span>
          </a>
            <a className="home-category" href="#postsContainer">
            <svg viewBox="0 0 24 24"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>
            <span>Music</span>
          </a>
            <a className="home-category" href="#postsContainer">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M5.7 6.7c3.8 1 7.2 4.4 8.2 8.2M10.1 3.2c1 3.8 4.4 7.2 8.2 8.2M4 15.5c4.8-.2 8.3 1.7 10.3 5"/></svg>
            <span>Sports</span>
          </a>
            <a className="home-category" href="#postsContainer">
            <svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3M10 10h4v4h-4z"/></svg>
            <span>Tech</span>
            </a>
          </nav>
        </div>
        <div className="desktop-actions">
          <ThemeToggle onToggle={onToggleTheme} />
          <button className="icon-btn notification-btn" aria-label="Notifications" title="Notifications">
            <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
            <span className="notification-ping"></span>
          </button>
        </div>
      </section>
      <Stories currentUser={currentUser} onOwnStoryStatusChange={onOwnStoryStatusChange} />
      <Composer value={composerValue} inputRef={composerRef} currentUser={currentUser} onChange={onComposerChange} onPublish={onPublish} isPublishing={isPublishing} />

      <section className="feed-filter">
        <button className={`filter${activeFilter === "for-you" ? " active" : ""}`} data-filter="for-you" onClick={() => onFilterChange("for-you")}>For you</button>
        <button className={`filter${activeFilter === "following" ? " active" : ""}`} data-filter="following" onClick={() => onFilterChange("following")}>Following</button>
        <span className="filter-line"></span>
      </section>

      <section className="posts" id="postsContainer">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            bookmarked={bookmarks.has(post.id)}
            onToggleLike={onToggleLike}
            onToggleBookmark={onToggleBookmark}
            onPostUpdated={onPostUpdated}
            onPostDeleted={onPostDeleted}
            onCommentCountChange={onCommentCountChange}
            onShowToast={onShowToast}
          />
        ))}
      </section>
    </main>
  );
}
