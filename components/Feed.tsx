import type { ChangeEvent, RefObject } from "react";
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
  onToggleLike: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onFilterChange: (filter: "for-you" | "following") => void;
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
  onToggleLike,
  onToggleBookmark,
  onFilterChange,
}: FeedProps) {
  return (
    <main className="feed" id="home">
      <section className="feed-topbar">
        <div>
          <span className="eyebrow">YOUR SPACE</span>
          <h1>Good evening, {currentUser.name}.</h1>
        </div>
        <div className="desktop-actions">
          <ThemeToggle onToggle={onToggleTheme} />
          <button className="icon-btn notification-btn" aria-label="Notifications" title="Notifications">
            <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
            <span className="notification-ping"></span>
          </button>
        </div>
      </section>

      <Stories currentUser={currentUser} />
      <Composer value={composerValue} inputRef={composerRef} currentUser={currentUser} onChange={onComposerChange} onPublish={onPublish} />

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
          />
        ))}
      </section>
    </main>
  );
}

