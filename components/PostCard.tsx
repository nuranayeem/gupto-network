import type { Post } from "@/types/social";

type PostCardProps = {
  post: Post;
  bookmarked: boolean;
  onToggleLike: (id: string) => void;
  onToggleBookmark: (id: string) => void;
};

function CreativeVisual() {
  return (
    <div className="visual-post visual-one" role="img" aria-label="Abstract futuristic creative studio illustration">
      <div className="visual-orb orb-a"></div>
      <div className="visual-orb orb-b"></div>
      <div className="visual-grid"></div>
      <div className="visual-label">
        <span>CREATIVE NOTE 024</span>
        <strong>LESS, BUT<br/>BETTER.</strong>
      </div>
    </div>
  );
}

function QuoteVisual() {
  return (
    <div className="quote-card">
      <span className="quote-mark">“</span>
      <p>Make room for the idea<br/>before you make it loud.</p>
      <span className="quote-credit">GUPTO NETWORK / DAILY THOUGHT</span>
    </div>
  );
}

function PosterVisual() {
  return (
    <div className="visual-post visual-two" role="img" aria-label="Colorful editorial poster composition">
      <div className="poster-shape shape-circle"></div>
      <div className="poster-shape shape-pill"></div>
      <div className="poster-title">MOVE<br/>WITH<br/>THE<br/>SIGNAL</div>
      <div className="poster-code">NXR — 08.26</div>
    </div>
  );
}

function formatCount(value: number) {
  if (value >= 1000) {
    const compact = (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1);
    return `${compact}K`;
  }
  return String(value);
}

export default function PostCard({ post, bookmarked, onToggleLike, onToggleBookmark }: PostCardProps) {
  const count = post.displayLikeCount && post.likeCount === 1200 && !post.liked
    ? post.displayLikeCount
    : formatCount(post.likeCount);

  return (
    <article className={`post card${post.isOwn ? " new-post" : ""}`} data-post-id={post.id}>
      <header className="post-header">
        <div className="post-user">
          {post.isOwn ? (
            <span className="profile-avatar">{post.initials}</span>
          ) : (
            <span className={`avatar ${post.avatarClass ?? ""}`}>{post.initials}</span>
          )}
          <div>
            <div className="name-row">
              <strong>{post.name}</strong>
              {post.verified ? <span className="verified">✓</span> : null}
            </div>
            <small>{post.handle} · {post.time}</small>
          </div>
        </div>
        <button className="ghost-btn" aria-label="Post menu">•••</button>
      </header>

      <div className="post-copy"><p>{post.text}</p></div>

      {post.visual === "creative" ? <CreativeVisual /> : null}
      {post.visual === "quote" ? <QuoteVisual /> : null}
      {post.visual === "poster" ? <PosterVisual /> : null}

      <footer className="post-actions">
        <button className="action-btn like-btn" type="button" data-liked={String(post.liked)} onClick={() => onToggleLike(post.id)}>
          <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z"/></svg>
          <span className="like-count">{count}</span>
        </button>
        <button className="action-btn" type="button">
          <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H9l-5 2v-6a4 4 0 0 1-1-3V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7Z"/></svg>
          <span>{post.comments}</span>
        </button>
        <button className="action-btn" type="button">
          <svg viewBox="0 0 24 24"><path d="m4 12 16-8-6 16-2-6-8-2Z"/><path d="m12 14 8-10"/></svg>
          <span>Share</span>
        </button>
        <button className={`action-btn bookmark-btn push-right${bookmarked ? " active" : ""}`} type="button" aria-label="Bookmark" onClick={() => onToggleBookmark(post.id)}>
          <svg viewBox="0 0 24 24"><path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z"/></svg>
        </button>
      </footer>
    </article>
  );
}

