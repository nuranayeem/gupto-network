"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import type { Post, PostComment, PostReply, PostVisibility, ReactionType } from "@/types/social";
import UserAvatar from "./UserAvatar";

type PostCardProps = {
  post: Post;
  bookmarked: boolean;
  onToggleLike: (id: string, type?: ReactionType) => Promise<void> | void;
  onToggleBookmark: (id: string) => void;
  onPostUpdated: (id: string, changes: Partial<Post>) => void;
  onPostDeleted: (id: string) => void;
  onCommentCountChange: (id: string, count: number) => void;
  onShowToast: (message: string) => void;
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

function formatActivityTime(value: string) {
  const createdAt = new Date(value);
  const diffSeconds = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 1000));
  if (diffSeconds < 60) return "now";
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(createdAt);
}

const threadEmojiOptions = [
  "😀", "😃", "😄", "😁", "😂", "🤣", "😊", "😍",
  "🥰", "😘", "😎", "🤩", "🤗", "🤔", "😅", "😢",
  "😭", "😡", "😮", "🤯", "🙄", "😴", "🥳", "😇",
  "🙏", "👍", "👏", "💪", "❤️", "💜", "💙", "🔥",
  "🎉", "✨", "💯", "✅", "🌸", "🌹", "🫶", "🤝",
];

function ThreadSmileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 10h.01M15.5 10h.01" />
      <path d="M8.5 14c1 1.35 2.15 2 3.5 2s2.5-.65 3.5-2" />
    </svg>
  );
}

function replyVisibilityKey(commentId: string, parentReplyId: string | null) {
  return parentReplyId ? `reply:${parentReplyId}` : `comment:${commentId}`;
}

function updateReplyTree(
  replies: PostReply[],
  replyId: string,
  updater: (reply: PostReply) => PostReply,
): PostReply[] {
  return replies.map((reply) => {
    if (reply.id === replyId) return updater(reply);
    if (!reply.replies.length) return reply;
    return { ...reply, replies: updateReplyTree(reply.replies, replyId, updater) };
  });
}

function removeReplyFromTree(replies: PostReply[], replyId: string): PostReply[] {
  return replies
    .filter((reply) => reply.id !== replyId)
    .map((reply) => reply.replies.length ? { ...reply, replies: removeReplyFromTree(reply.replies, replyId) } : reply);
}

function appendReplyToTree(replies: PostReply[], parentReplyId: string, newReply: PostReply): PostReply[] {
  return replies.map((reply) => {
    if (reply.id === parentReplyId) return { ...reply, replies: [...reply.replies, newReply] };
    if (!reply.replies.length) return reply;
    return { ...reply, replies: appendReplyToTree(reply.replies, parentReplyId, newReply) };
  });
}

type ReplyTarget = {
  commentId: string;
  parentReplyId: string | null;
  authorName: string;
};

type ShareNetwork = "facebook" | "x" | "whatsapp" | "telegram";

function ShareNetworkIcon({ network }: { network: ShareNetwork }) {
  if (network === "facebook") {
    return (
      <svg className="share-brand-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13.55 21v-8h2.7l.4-3h-3.1V8.1c0-.87.24-1.47 1.55-1.47h1.66V3.95c-.29-.04-1.27-.12-2.42-.12-2.4 0-4.04 1.46-4.04 4.15V10H7.58v3h2.72v8h3.25Z" />
      </svg>
    );
  }

  if (network === "x") {
    return (
      <svg className="share-brand-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
      </svg>
    );
  }

  if (network === "whatsapp") {
    return (
      <svg className="share-brand-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.25a8.75 8.75 0 0 0-7.51 13.24L3.25 20.75l4.38-1.15A8.75 8.75 0 1 0 12 3.25Z" className="share-brand-whatsapp-ring" />
        <path d="M9.15 7.85c.2-.45.4-.46.7-.47h.59c.18 0 .38.06.48.34l.78 1.9c.08.2.04.39-.1.57l-.58.72c-.14.17-.17.33-.04.56.44.76 1.03 1.41 1.74 1.92.63.45 1.31.8 2.04 1.03.25.08.4.03.55-.15l.82-1c.17-.2.35-.22.58-.13l1.85.88c.25.12.42.2.48.32.06.13.06.73-.18 1.4-.22.62-1.2 1.18-1.83 1.3-.48.1-1.08.14-1.75-.07-.4-.12-.9-.3-1.54-.58a10.8 10.8 0 0 1-4.56-3.98c-.9-1.26-1.5-2.65-1.52-3.73-.01-1.03.53-1.57.79-1.84.2-.2.43-.27.7-.27Z" className="share-brand-whatsapp-phone" />
      </svg>
    );
  }

  return (
    <svg className="share-brand-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.5 4.55 18.36 19.3c-.24 1.04-.86 1.3-1.74.81l-4.78-3.52-2.31 2.22c-.26.26-.47.47-.96.47l.34-4.87 8.86-8c.39-.34-.08-.53-.6-.19L6.22 13.11 1.5 11.64c-1.03-.32-1.05-1.03.21-1.52L20.17 3c.86-.31 1.61.2 1.33 1.55Z" />
    </svg>
  );
}

function ShareUtilityIcon({ type }: { type: "link" | "copy" | "more" }) {
  if (type === "link") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 14.5 14.5 9"/><path d="M7.5 17.5H6a4 4 0 0 1 0-8h4M16.5 6.5H18a4 4 0 1 1 0 8h-4"/></svg>;
  if (type === "copy") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="m8 11 8-4M8 13l8 4"/></svg>;
}

function VisibilityIcon({ visibility }: { visibility: PostVisibility }) {
  if (visibility === "PRIVATE") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
  }
  if (visibility === "FRIENDS") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 20c0-4 2.5-7 6-7s6 3 6 7M14 15c3.5-.7 6 1.5 6 5"/></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>;
}

const visibilityOptions: { value: PostVisibility; label: string; helper: string }[] = [
  { value: "PUBLIC", label: "Public", helper: "Anyone on Gupto" },
  { value: "FRIENDS", label: "Friends only", helper: "Accepted friends" },
  { value: "PRIVATE", label: "Private", helper: "Only you" },
];

const reactionOptions: { type: ReactionType; label: string; color: string; accent?: string }[] = [
  { type: "LIKE", label: "Like", color: "#2F80ED" },
  { type: "LOVE", label: "Love", color: "#FF4F78" },
  { type: "CARE", label: "Care", color: "#FECB4C", accent: "#DC2E43" },
  { type: "HAHA", label: "Haha", color: "#F5B700" },
  { type: "WOW", label: "Wow", color: "#F6B928", accent: "#6F4A00" },
  { type: "SAD", label: "Sad", color: "#5B8DEF", accent: "#74B8FF" },
  { type: "ANGRY", label: "Angry", color: "#F05A47" },
  { type: "SANDAL", label: "Sandal", color: "#19A6EA", accent: "#036DB1" },
];

function ReactionIcon({ type, filled = true }: { type: ReactionType; filled?: boolean }) {
  if (type === "LIKE") {
    return (
      <svg className={`reaction-icon reaction-icon-like${filled ? " is-filled" : " is-outline"}`} viewBox="0 0 32 32" aria-hidden="true">
        <path d="M10.5 14.5v12H6.8A2.8 2.8 0 0 1 4 23.7v-6.4a2.8 2.8 0 0 1 2.8-2.8h3.7Z" />
        <path d="M12 26.5h10.2c1.8 0 3.4-1.2 3.8-3l1.8-7.4a3 3 0 0 0-2.9-3.7h-6.1l.7-3.3c.4-2.1-.9-4.2-3-4.8l-.8-.2-5.2 10.4v9.2c0 1.5.6 2.8 1.5 2.8Z" />
      </svg>
    );
  }
  if (type === "LOVE") {
    return (
      <svg className="reaction-icon reaction-icon-love" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 27.2 5.8 17.4A7.2 7.2 0 0 1 16 7.2a7.2 7.2 0 0 1 10.2 10.2L16 27.2Z" />
      </svg>
    );
  }
  if (type === "CARE") {
    return (
      <img
        className="reaction-icon reaction-icon-image reaction-icon-care-art"
        src="/images/reactions/care-emoji.svg"
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    );
  }
  if (type === "HAHA") {
    return (
      <svg className="reaction-icon reaction-icon-haha" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="12" className="reaction-face" />
        <path d="M9.5 12.5c1.3-1.3 2.7-1.3 4 0M18.5 12.5c1.3-1.3 2.7-1.3 4 0" className="reaction-stroke" />
        <path d="M9.5 17.2h13c-.6 5-3.4 7.4-6.5 7.4s-5.9-2.4-6.5-7.4Z" className="reaction-mouth" />
        <path d="M13 22.2c2-1.2 4-1.2 6 0" className="reaction-tongue" />
      </svg>
    );
  }
  if (type === "WOW") {
    return (
      <svg className="reaction-icon reaction-icon-wow" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="12" className="reaction-face" />
        <path d="M9.3 10.3c1.4-1.1 2.9-1.5 4.3-1.2M22.7 10.3c-1.4-1.1-2.9-1.5-4.3-1.2" className="reaction-stroke reaction-wow-brow" />
        <ellipse cx="11.8" cy="14.2" rx="1.7" ry="2.35" className="reaction-wow-detail" />
        <ellipse cx="20.2" cy="14.2" rx="1.7" ry="2.35" className="reaction-wow-detail" />
        <ellipse cx="16" cy="21" rx="3.25" ry="4.15" className="reaction-wow-mouth" />
        <ellipse cx="16" cy="22.4" rx="1.55" ry="1.1" className="reaction-wow-tongue" />
      </svg>
    );
  }
  if (type === "SAD") {
    return (
      <svg className="reaction-icon reaction-icon-sad" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="12" className="reaction-face" />
        <circle cx="12" cy="13" r="1.25" className="reaction-cut" />
        <circle cx="20" cy="13" r="1.25" className="reaction-cut" />
        <path d="M11.5 21c1.4-2.2 3-3.2 4.5-3.2s3.1 1 4.5 3.2" className="reaction-stroke" />
        <path d="M22.3 14.6c2 2.8 2.3 4.4.8 5.7-1.5 1.3-3.7.4-3.7-1.6 0-1.2 1-2.5 2.9-4.1Z" className="reaction-accent" />
      </svg>
    );
  }
  if (type === "SANDAL") {
    return (
      <img
        className="reaction-icon reaction-icon-image reaction-icon-sandal-art"
        src="/images/reactions/sandal-emoji.svg"
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    );
  }
  return (
    <svg className="reaction-icon reaction-icon-angry" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="12" className="reaction-face" />
      <path d="m8.8 11.2 5 2M23.2 11.2l-5 2" className="reaction-stroke reaction-brow" />
      <circle cx="12" cy="14.8" r="1.2" className="reaction-cut" />
      <circle cx="20" cy="14.8" r="1.2" className="reaction-cut" />
      <path d="M11.2 22c1.4-1.7 3-2.5 4.8-2.5s3.4.8 4.8 2.5" className="reaction-stroke" />
    </svg>
  );
}


type ThreadReactionButtonProps = {
  endpoint: string;
  initialType?: ReactionType | null;
  initialCount: number;
  onChange: (type: ReactionType | null, count: number) => void;
  onShowToast: (message: string) => void;
};

function ThreadReactionButton({ endpoint, initialType, initialCount, onChange, onShowToast }: ThreadReactionButtonProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef(false);
  const touchStartRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const close = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [pickerOpen]);

  useEffect(() => () => {
    if (holdRef.current) clearTimeout(holdRef.current);
    if (closeRef.current) clearTimeout(closeRef.current);
  }, []);

  const clearHold = () => {
    touchStartRef.current = null;
    if (holdRef.current) {
      clearTimeout(holdRef.current);
      holdRef.current = null;
    }
  };

  const scheduleClose = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    if (closeRef.current) clearTimeout(closeRef.current);
    closeRef.current = setTimeout(() => setPickerOpen(false), 180);
  };

  const openDesktop = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    if (closeRef.current) clearTimeout(closeRef.current);
    setPickerOpen(true);
  };

  const react = async (type: ReactionType) => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const payload = (await response.json().catch(() => null)) as { reacted?: boolean; type?: ReactionType | null; count?: number; error?: string } | null;
      if (!response.ok || !payload) {
        onShowToast(payload?.error || "Could not update reaction");
        return;
      }
      onChange(payload.reacted ? payload.type || type : null, payload.count ?? initialCount);
      setPickerOpen(false);
    } catch {
      onShowToast("Could not update reaction");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`thread-reaction${pickerOpen ? " open" : ""}`}
      ref={wrapRef}
      onPointerEnter={openDesktop}
      onPointerLeave={scheduleClose}
    >
      <div className={`thread-reaction-picker${pickerOpen ? " open" : ""}`} role="menu" aria-label="Choose a reaction" onPointerEnter={openDesktop} onPointerLeave={scheduleClose}>
        {reactionOptions.map((reaction) => (
          <button
            key={reaction.type}
            type="button"
            role="menuitemradio"
            aria-checked={initialType === reaction.type}
            aria-label={reaction.label}
            title={reaction.label}
            style={{ "--reaction-color": reaction.color, "--reaction-accent": reaction.accent || reaction.color } as CSSProperties}
            onClick={(event) => { event.stopPropagation(); void react(reaction.type); }}
          >
            <ReactionIcon type={reaction.type} />
          </button>
        ))}
      </div>
      <button
        className={`thread-react-btn${initialType ? " active" : ""}`}
        type="button"
        disabled={busy}
        title={initialType ? reactionOptions.find((item) => item.type === initialType)?.label : "React"}
        style={initialType ? {
          "--reaction-color": reactionOptions.find((item) => item.type === initialType)?.color,
          "--reaction-accent": reactionOptions.find((item) => item.type === initialType)?.accent || reactionOptions.find((item) => item.type === initialType)?.color,
        } as CSSProperties : undefined}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") return;
          touchStartRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
          if (holdRef.current) clearTimeout(holdRef.current);
          holdRef.current = setTimeout(() => {
            suppressClickRef.current = true;
            setPickerOpen(true);
            holdRef.current = null;
          }, 430);
        }}
        onPointerMove={(event) => {
          const start = touchStartRef.current;
          if (!start || start.pointerId !== event.pointerId || event.pointerType === "mouse") return;
          if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) clearHold();
        }}
        onPointerUp={clearHold}
        onPointerCancel={clearHold}
        onClick={() => {
          clearHold();
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          void react(initialType || "LIKE");
        }}
      >
        <ReactionIcon type={initialType || "LIKE"} filled={Boolean(initialType)} />
        {initialCount > 0 ? <span>{formatCount(initialCount)}</span> : <span>React</span>}
      </button>
    </div>
  );
}

type ThreadMessageProps = {
  kind: "comment" | "reply";
  postId: string;
  commentId: string;
  item: PostComment | PostComment["replies"][number];
  onReply?: () => void;
  onUpdate: (text: string, wasEdited: boolean) => void;
  onDelete: () => void;
  onReactionChange: (type: ReactionType | null, count: number) => void;
  onShowToast: (message: string) => void;
};

function ThreadMessage({ kind, postId, commentId, item, onReply, onUpdate, onDelete, onReactionChange, onShowToast }: ThreadMessageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.text);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStartRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  useEffect(() => setEditValue(item.text), [item.text]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  useEffect(() => () => {
    if (holdRef.current) clearTimeout(holdRef.current);
  }, []);

  const clearHold = () => {
    holdStartRef.current = null;
    if (holdRef.current) {
      clearTimeout(holdRef.current);
      holdRef.current = null;
    }
  };

  const endpoint = kind === "comment"
    ? `/api/posts/${postId}/comments/${commentId}`
    : `/api/posts/${postId}/comments/${commentId}/replies/${item.id}`;
  const reactionEndpoint = `${endpoint}/reaction`;

  const saveEdit = async () => {
    const text = editValue.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const payload = (await response.json().catch(() => null)) as { comment?: { text: string; wasEdited?: boolean }; reply?: { text: string; wasEdited?: boolean }; error?: string } | null;
      const updated = kind === "comment" ? payload?.comment : payload?.reply;
      if (!response.ok || !updated) {
        onShowToast(payload?.error || `Could not edit ${kind}`);
        return;
      }
      onUpdate(updated.text, Boolean(updated.wasEdited));
      setEditing(false);
      setMenuOpen(false);
      onShowToast(kind === "comment" ? "Comment updated" : "Reply updated");
    } catch {
      onShowToast(`Could not edit ${kind}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (busy || !window.confirm(`Delete this ${kind}?`)) return;
    setBusy(true);
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as { deleted?: boolean; error?: string } | null;
      if (!response.ok || !payload?.deleted) {
        onShowToast(payload?.error || `Could not delete ${kind}`);
        return;
      }
      onDelete();
      onShowToast(kind === "comment" ? "Comment deleted" : "Reply deleted");
    } catch {
      onShowToast(`Could not delete ${kind}`);
    } finally {
      setBusy(false);
      setMenuOpen(false);
    }
  };

  return (
    <div className={`thread-message${kind === "reply" ? " is-reply" : ""}`}>
      <UserAvatar
        initials={item.author.initials}
        image={item.author.avatarUrl}
        theme={item.author.avatarTheme}
        className={kind === "reply" ? "reply-avatar" : "comment-avatar"}
      />
      <div className="thread-message-main">
        <div className="thread-bubble-wrap" ref={menuRef}>
          {editing ? (
            <div className="thread-edit-box">
              <textarea maxLength={500} rows={2} value={editValue} onChange={(event) => setEditValue(event.target.value)} autoFocus />
              <div><button type="button" onClick={() => { setEditing(false); setEditValue(item.text); }}>Cancel</button><button type="button" disabled={!editValue.trim() || busy} onClick={() => void saveEdit()}>{busy ? "Saving…" : "Save"}</button></div>
            </div>
          ) : (
            <div
              className={`post-comment-bubble${item.isOwn ? " is-own" : ""}`}
              title={item.isOwn ? `Press and hold to edit or delete this ${kind}` : undefined}
              onPointerDown={(event) => {
                if (!item.isOwn) return;
                holdStartRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
                if (holdRef.current) clearTimeout(holdRef.current);
                holdRef.current = setTimeout(() => {
                  setMenuOpen(true);
                  holdRef.current = null;
                }, 480);
              }}
              onPointerMove={(event) => {
                const start = holdStartRef.current;
                if (!start || start.pointerId !== event.pointerId) return;
                if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) clearHold();
              }}
              onPointerUp={clearHold}
              onPointerCancel={clearHold}
              onPointerLeave={clearHold}
              onContextMenu={(event) => { if (item.isOwn) event.preventDefault(); }}
            >
              <strong>{item.author.name}</strong>
              <p>{item.text}</p>
            </div>
          )}

          {menuOpen && item.isOwn && !editing ? (
            <div className="thread-hold-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { setEditing(true); setMenuOpen(false); }}>Edit</button>
              <button type="button" className="danger" role="menuitem" onClick={() => void remove()}>Delete</button>
            </div>
          ) : null}
        </div>

        <div className="post-comment-meta">
          <span>{formatActivityTime(item.createdAt)}{item.wasEdited ? " · edited" : ""}</span>
          <ThreadReactionButton
            endpoint={reactionEndpoint}
            initialType={item.reactionType}
            initialCount={item.reactionCount}
            onChange={onReactionChange}
            onShowToast={onShowToast}
          />
          {onReply ? <button type="button" onClick={onReply}>Reply</button> : null}
        </div>
      </div>
    </div>
  );
}

export default function PostCard({
  post,
  bookmarked,
  onToggleLike,
  onToggleBookmark,
  onPostUpdated,
  onPostDeleted,
  onCommentCountChange,
  onShowToast,
}: PostCardProps) {
  const count = post.displayLikeCount && post.likeCount === 1200 && !post.liked
    ? post.displayLikeCount
    : formatCount(post.likeCount);

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuLayout, setMobileMenuLayout] = useState<"single" | "multiple">("single");
  const [shareOpen, setShareOpen] = useState(false);
  const [sharedLinkFocus, setSharedLinkFocus] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(post.text);
  const [postBusy, setPostBusy] = useState(false);
  const [threadOpen, setThreadOpen] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentValue, setCommentValue] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [replyValue, setReplyValue] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<"comment" | "reply" | null>(null);
  const [visibleCommentCount, setVisibleCommentCount] = useState(3);
  const [visibleReplyCounts, setVisibleReplyCounts] = useState<Record<string, number>>({});
  const menuRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLElement>(null);
  const commentToggleRef = useRef<HTMLButtonElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);
  const reactionRef = useRef<HTMLDivElement>(null);
  const reactionPickerScrollRef = useRef<HTMLDivElement>(null);
  const reactionHoldRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionHoverCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionTouchStartRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const suppressReactionClickRef = useRef(false);

  useEffect(() => {
    setEditValue(post.text);
  }, [post.text]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  useEffect(() => {
    if (!shareOpen) return;

    const close = (event: PointerEvent) => {
      if (!shareRef.current?.contains(event.target as Node)) setShareOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShareOpen(false);
    };

    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [shareOpen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isSharedTarget = params.get("post") === post.id || window.location.hash === `#post-${post.id}`;
    if (!isSharedTarget) return;

    setSharedLinkFocus(true);
    const scrollTimer = window.setTimeout(() => {
      document.getElementById(`post-${post.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 140);
    const glowTimer = window.setTimeout(() => setSharedLinkFocus(false), 3200);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(glowTimer);
    };
  }, [post.id]);

  useEffect(() => {
    if (!threadOpen) return;
    const closeThread = (event: PointerEvent) => {
      const target = event.target as Node;
      if (threadRef.current?.contains(target)) return;
      if (commentToggleRef.current?.contains(target)) return;
      setThreadOpen(false);
      setReplyTarget(null);
      setReplyValue("");
      setEmojiPickerTarget(null);
    };
    document.addEventListener("pointerdown", closeThread);
    return () => document.removeEventListener("pointerdown", closeThread);
  }, [threadOpen]);

  useEffect(() => {
    if (!emojiPickerTarget) return;
    const closeEmojiPicker = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-thread-emoji-picker]")) return;
      if (target?.closest("[data-thread-emoji-trigger]")) return;
      setEmojiPickerTarget(null);
    };
    document.addEventListener("pointerdown", closeEmojiPicker);
    return () => document.removeEventListener("pointerdown", closeEmojiPicker);
  }, [emojiPickerTarget]);

  useEffect(() => () => {
    if (reactionHoldRef.current) clearTimeout(reactionHoldRef.current);
    if (reactionHoverCloseRef.current) clearTimeout(reactionHoverCloseRef.current);
  }, []);

  useEffect(() => {
    if (!reactionPickerOpen) return;
    const close = (event: PointerEvent) => {
      if (!reactionRef.current?.contains(event.target as Node)) setReactionPickerOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [reactionPickerOpen]);

  useEffect(() => {
    if (!reactionPickerOpen) return;
    const picker = reactionPickerScrollRef.current;
    if (!picker) return;

    const lockPageAndScrollPicker = (event: WheelEvent) => {
      // The reaction rail owns the wheel while it is open. Prevent the same
      // wheel gesture from bubbling into the document and moving the page.
      event.preventDefault();
      event.stopPropagation();

      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (delta && picker.scrollWidth > picker.clientWidth) {
        picker.scrollLeft += delta;
      }
    };

    picker.addEventListener("wheel", lockPageAndScrollPicker, { passive: false });
    return () => picker.removeEventListener("wheel", lockPageAndScrollPicker);
  }, [reactionPickerOpen]);

  const getShareUrl = () => {
    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
    const origin = configuredOrigin || window.location.origin;
    return `${origin}/?post=${encodeURIComponent(post.id)}#post-${encodeURIComponent(post.id)}`;
  };

  const getShareText = () => {
    const normalized = post.text.replace(/\s+/g, " ").trim();
    const excerpt = normalized.length > 150 ? `${normalized.slice(0, 147)}…` : normalized;
    return excerpt ? `${post.name} on Gupto: ${excerpt}` : `${post.name} shared a post on Gupto.`;
  };

  const openShareWindow = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=720,height=680");
  };

  const shareToNetwork = (network: ShareNetwork) => {
    const url = getShareUrl();
    const text = getShareText();
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);
    const combinedText = encodeURIComponent(`${text}\n${url}`);

    const target = network === "facebook"
      ? `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
      : network === "x"
        ? `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
        : network === "whatsapp"
          ? `https://wa.me/?text=${combinedText}`
          : `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;

    openShareWindow(target);
    setShareOpen(false);
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        return copied;
      } catch {
        return false;
      }
    }
  };

  const copyShareLink = async () => {
    const copied = await copyToClipboard(getShareUrl());
    onShowToast(copied ? "Post link copied" : "Could not copy post link");
    if (copied) setShareOpen(false);
  };

  const copyPostAndLink = async () => {
    const copied = await copyToClipboard(`${getShareText()}\n${getShareUrl()}`);
    onShowToast(copied ? "Post and link copied" : "Could not copy post");
    if (copied) setShareOpen(false);
  };

  const nativeShare = async () => {
    const shareData = { title: `${post.name} on Gupto`, text: getShareText(), url: getShareUrl() };
    if (!navigator.share) {
      await copyShareLink();
      return;
    }

    try {
      await navigator.share(shareData);
      setShareOpen(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      onShowToast("Could not open device share");
    }
  };

  const clearReactionHoverClose = () => {
    if (reactionHoverCloseRef.current) {
      clearTimeout(reactionHoverCloseRef.current);
      reactionHoverCloseRef.current = null;
    }
  };

  const openDesktopReactionPicker = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    clearReactionHoverClose();
    setReactionPickerOpen(true);
  };

  const scheduleDesktopReactionPickerClose = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    clearReactionHoverClose();
    reactionHoverCloseRef.current = setTimeout(() => {
      setReactionPickerOpen(false);
      reactionHoverCloseRef.current = null;
    }, 180);
  };

  const chooseReaction = (type: ReactionType) => {
    suppressReactionClickRef.current = false;
    setReactionPickerOpen(false);
    void onToggleLike(post.id, type);
  };

  const handleReactionPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse") return;
    clearReactionHoverClose();
    reactionTouchStartRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    if (reactionHoldRef.current) clearTimeout(reactionHoldRef.current);
    reactionHoldRef.current = setTimeout(() => {
      suppressReactionClickRef.current = true;
      setReactionPickerOpen(true);
      reactionHoldRef.current = null;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(10);
    }, 430);
  };

  const handleReactionPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = reactionTouchStartRef.current;
    if (!start || start.pointerId !== event.pointerId || event.pointerType === "mouse") return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) {
      clearReactionHold();
    }
  };

  const clearReactionHold = () => {
    reactionTouchStartRef.current = null;
    if (reactionHoldRef.current) {
      clearTimeout(reactionHoldRef.current);
      reactionHoldRef.current = null;
    }
  };

  const handlePrimaryReaction = () => {
    clearReactionHold();
    if (suppressReactionClickRef.current) {
      // A touch/pen long-press intentionally opened the picker. The synthetic
      // click that follows finger release must not close it or apply Like.
      suppressReactionClickRef.current = false;
      return;
    }
    setReactionPickerOpen(false);
    void onToggleLike(post.id, post.reactionType || "LIKE");
  };

  const savePostEdit = async () => {
    const text = editValue.trim();
    if (!text || postBusy) return;
    setPostBusy(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const payload = (await response.json().catch(() => null)) as { post?: Partial<Post>; error?: string } | null;
      if (!response.ok || !payload?.post) {
        onShowToast(payload?.error || "Could not update post");
        return;
      }
      onPostUpdated(post.id, { text: payload.post.text || text, wasEdited: true });
      setEditing(false);
      onShowToast("Post updated");
    } catch {
      onShowToast("Could not update post");
    } finally {
      setPostBusy(false);
    }
  };

  const changeVisibility = async (visibility: PostVisibility) => {
    if (postBusy || visibility === post.visibility) {
      setMenuOpen(false);
      return;
    }
    setPostBusy(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility }),
      });
      const payload = (await response.json().catch(() => null)) as { post?: { visibility?: PostVisibility }; error?: string } | null;
      if (!response.ok || !payload?.post?.visibility) {
        onShowToast(payload?.error || "Could not change post privacy");
        return;
      }
      onPostUpdated(post.id, { visibility: payload.post.visibility });
      onShowToast(`Post privacy: ${visibilityOptions.find((item) => item.value === visibility)?.label || visibility}`);
    } catch {
      onShowToast("Could not change post privacy");
    } finally {
      setPostBusy(false);
      setMenuOpen(false);
    }
  };

  const deletePost = async () => {
    if (postBusy || !window.confirm("Delete this post permanently?")) return;
    setPostBusy(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as { deleted?: boolean; error?: string } | null;
      if (!response.ok || !payload?.deleted) {
        onShowToast(payload?.error || "Could not delete post");
        return;
      }
      onPostDeleted(post.id);
      onShowToast("Post deleted");
    } catch {
      onShowToast("Could not delete post");
    } finally {
      setPostBusy(false);
      setMenuOpen(false);
    }
  };

  const loadComments = async () => {
    if (commentsLoaded || commentsLoading) return;
    setCommentsLoading(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { comments?: PostComment[]; error?: string } | null;
      if (!response.ok || !payload?.comments) {
        onShowToast(payload?.error || "Could not load comments");
        return;
      }
      setComments(payload.comments);
      setVisibleCommentCount(3);
      setVisibleReplyCounts({});
      setCommentsLoaded(true);
      onCommentCountChange(post.id, payload.comments.length);
    } catch {
      onShowToast("Could not load comments");
    } finally {
      setCommentsLoading(false);
    }
  };

  const toggleComments = () => {
    const next = !threadOpen;
    setThreadOpen(next);
    if (!next) setEmojiPickerTarget(null);
    if (next) void loadComments();
  };

  const submitComment = async () => {
    const text = commentValue.trim();
    if (!text || commentBusy) return;
    setCommentBusy(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const payload = (await response.json().catch(() => null)) as { comment?: PostComment; count?: number; error?: string } | null;
      if (!response.ok || !payload?.comment) {
        onShowToast(payload?.error || "Could not add comment");
        return;
      }
      setComments((current) => [payload.comment!, ...current]);
      setVisibleCommentCount((current) => Math.max(3, current));
      setCommentsLoaded(true);
      setCommentValue("");
      setEmojiPickerTarget(null);
      onCommentCountChange(post.id, payload.count ?? comments.length + 1);
      onShowToast("Comment added");
    } catch {
      onShowToast("Could not add comment");
    } finally {
      setCommentBusy(false);
    }
  };

  const submitReply = async (target: ReplyTarget) => {
    const text = replyValue.trim();
    if (!text || replyBusy) return;
    setReplyBusy(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments/${target.commentId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, parentReplyId: target.parentReplyId }),
      });
      const payload = (await response.json().catch(() => null)) as { reply?: PostReply; error?: string } | null;
      if (!response.ok || !payload?.reply) {
        onShowToast(payload?.error || "Could not add reply");
        return;
      }

      setComments((current) => current.map((comment) => {
        if (comment.id !== target.commentId) return comment;
        if (!target.parentReplyId) return { ...comment, replies: [...comment.replies, payload.reply!] };
        return { ...comment, replies: appendReplyToTree(comment.replies, target.parentReplyId, payload.reply!) };
      }));

      const visibilityKey = replyVisibilityKey(target.commentId, target.parentReplyId);
      setVisibleReplyCounts((current) => ({
        ...current,
        [visibilityKey]: (current[visibilityKey] ?? 3) + 1,
      }));
      setReplyValue("");
      setReplyTarget(null);
      setEmojiPickerTarget(null);
      onShowToast("Reply added");
    } catch {
      onShowToast("Could not add reply");
    } finally {
      setReplyBusy(false);
    }
  };

  const togglePostMenu = () => {
    if (!post.isOwn) return;

    setMenuOpen((current) => {
      const next = !current;
      if (next) {
        const currentPost = menuRef.current?.closest<HTMLElement>(".post");
        const postsContainer = currentPost?.parentElement;
        const siblingPosts = postsContainer
          ? Array.from(postsContainer.children).filter((child): child is HTMLElement =>
              child instanceof HTMLElement && child.classList.contains("post"),
            )
          : currentPost
            ? [currentPost]
            : [];
        const lastPost = siblingPosts[siblingPosts.length - 1];
        const isBottomPost = Boolean(currentPost && lastPost === currentPost);

        // Mobile rule: only the final/bottom post gets the safe bottom-sheet menu.
        // Every post above it keeps the compact anchored popup beside its 3-dot button.
        setMobileMenuLayout(isBottomPost ? "single" : "multiple");
      }
      return next;
    });
  };

  const insertThreadEmoji = (target: "comment" | "reply", emoji: string) => {
    const input = target === "comment" ? commentInputRef.current : replyInputRef.current;
    const currentValue = target === "comment" ? commentValue : replyValue;
    const start = input?.selectionStart ?? currentValue.length;
    const end = input?.selectionEnd ?? start;
    if (currentValue.length - (end - start) + emoji.length > 500) return;

    const nextValue = `${currentValue.slice(0, start)}${emoji}${currentValue.slice(end)}`;
    if (target === "comment") setCommentValue(nextValue);
    else setReplyValue(nextValue);

    const nextCursor = start + emoji.length;
    requestAnimationFrame(() => {
      const activeInput = target === "comment" ? commentInputRef.current : replyInputRef.current;
      activeInput?.focus();
      activeInput?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const renderThreadEmojiPicker = (target: "comment" | "reply") => {
    const open = emojiPickerTarget === target;
    if (!open) return null;

    return (
      <div className="thread-emoji-picker" data-thread-emoji-picker role="menu" aria-label="Choose an emoji">
        {threadEmojiOptions.map((emoji, index) => (
          <button
            key={`${emoji}-${index}`}
            type="button"
            role="menuitem"
            aria-label={`Insert ${emoji}`}
            title={emoji}
            onClick={(event) => {
              event.stopPropagation();
              insertThreadEmoji(target, emoji);
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    );
  };

  const toggleReplyTarget = (target: ReplyTarget) => {
    setReplyTarget((current) => {
      const sameTarget = current?.commentId === target.commentId && current.parentReplyId === target.parentReplyId;
      return sameTarget ? null : target;
    });
    setReplyValue("");
    setEmojiPickerTarget(null);
  };

  const renderReplyComposer = (target: ReplyTarget, nested = false) => {
    const active = replyTarget?.commentId === target.commentId && replyTarget.parentReplyId === target.parentReplyId;
    if (!active) return null;

    return (
      <div className={`post-reply-composer${nested ? " is-nested" : " is-comment-target"}`}>
        <div className="thread-input-shell">
          <input
            ref={replyInputRef}
            maxLength={500}
            value={replyValue}
            onChange={(event) => setReplyValue(event.target.value)}
            placeholder={`Reply to ${target.authorName}…`}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submitReply(target);
              }
            }}
            autoFocus
          />
          <button
            className={`thread-emoji-trigger${emojiPickerTarget === "reply" ? " active" : ""}`}
            data-thread-emoji-trigger
            type="button"
            aria-label="Add emoji to reply"
            aria-expanded={emojiPickerTarget === "reply"}
            title="Add emoji"
            onClick={() => setEmojiPickerTarget((current) => current === "reply" ? null : "reply")}
          >
            <ThreadSmileIcon />
          </button>
          {renderThreadEmojiPicker("reply")}
        </div>
        <button className="thread-submit-btn" type="button" disabled={!replyValue.trim() || replyBusy} onClick={() => void submitReply(target)}>
          {replyBusy ? "…" : "Reply"}
        </button>
      </div>
    );
  };

  const renderReplyBranch = (commentId: string, replies: PostReply[], parentReplyId: string | null, depth = 0): ReactNode => {
    if (!replies.length) return null;

    const visibilityKey = replyVisibilityKey(commentId, parentReplyId);
    const visibleReplies = visibleReplyCounts[visibilityKey] ?? 3;
    const hiddenReplies = Math.max(0, replies.length - visibleReplies);
    const branchClass = `post-replies${depth > 0 ? " is-nested" : ""}${depth >= 2 ? " is-deep" : ""}`;

    return (
      <div className={branchClass}>
        <div className="thread-connector" aria-hidden="true"></div>
        {replies.slice(0, visibleReplies).map((reply) => {
          const target: ReplyTarget = { commentId, parentReplyId: reply.id, authorName: reply.author.name };
          return (
            <article className="post-reply" key={reply.id}>
              <ThreadMessage
                kind="reply"
                postId={post.id}
                commentId={commentId}
                item={reply}
                onReply={() => toggleReplyTarget(target)}
                onUpdate={(text, wasEdited) => setComments((current) => current.map((comment) => comment.id === commentId ? {
                  ...comment,
                  replies: updateReplyTree(comment.replies, reply.id, (currentReply) => ({ ...currentReply, text, wasEdited })),
                } : comment))}
                onDelete={() => {
                  setComments((current) => current.map((comment) => comment.id === commentId ? {
                    ...comment,
                    replies: removeReplyFromTree(comment.replies, reply.id),
                  } : comment));
                  if (replyTarget?.commentId === commentId) setReplyTarget(null);
                }}
                onReactionChange={(reactionType, reactionCount) => setComments((current) => current.map((comment) => comment.id === commentId ? {
                  ...comment,
                  replies: updateReplyTree(comment.replies, reply.id, (currentReply) => ({ ...currentReply, reactionType, reactionCount })),
                } : comment))}
                onShowToast={onShowToast}
              />

              {renderReplyComposer(target, true)}
              {renderReplyBranch(commentId, reply.replies, reply.id, depth + 1)}
            </article>
          );
        })}

        {hiddenReplies > 0 ? (
          <button className="thread-more-btn reply-more" type="button" onClick={() => setVisibleReplyCounts((current) => ({
            ...current,
            [visibilityKey]: (current[visibilityKey] ?? 3) + 3,
          }))}>
            View {Math.min(3, hiddenReplies)} more {hiddenReplies === 1 ? "reply" : "replies"}
          </button>
        ) : replies.length > 3 && visibleReplies >= replies.length ? (
          <button className="thread-more-btn reply-more" type="button" onClick={() => setVisibleReplyCounts((current) => ({ ...current, [visibilityKey]: 3 }))}>
            Show fewer replies
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <article id={`post-${post.id}`} className={`post card${post.isOwn ? " new-post" : ""}${sharedLinkFocus ? " shared-post-focus" : ""}`} data-post-id={post.id}>
      <header className="post-header">
        <div className="post-user">
          {post.isOwn ? (
            <UserAvatar initials={post.initials} image={post.avatarUrl} theme={post.avatarTheme} />
          ) : (
            <UserAvatar initials={post.initials} image={post.avatarUrl} theme={post.avatarTheme} className={`avatar ${post.avatarClass ?? ""}`} />
          )}
          <div>
            <div className="name-row">
              <strong>{post.name}</strong>
              {post.verified ? <span className="verified">✓</span> : null}
            </div>
            <small className="post-meta-line">
              {post.handle} · {post.time}{post.wasEdited ? " · edited" : ""}
              {post.isOwn ? <span className="post-visibility-mini" title={visibilityOptions.find((item) => item.value === post.visibility)?.label}><VisibilityIcon visibility={post.visibility} /></span> : null}
            </small>
          </div>
        </div>
        <div className="post-menu-wrap" ref={menuRef}>
          <button className="ghost-btn" type="button" aria-label={post.isOwn ? "Manage post" : "Post menu"} aria-expanded={post.isOwn ? menuOpen : undefined} onClick={togglePostMenu}>•••</button>
          {menuOpen && post.isOwn ? (
            <div className={`post-menu card mobile-${mobileMenuLayout}-post-menu`} role="menu">
              <>
                  <button type="button" role="menuitem" onClick={() => { setEditing(true); setMenuOpen(false); }}>
                    <span>✎</span><div><strong>Edit post</strong><small>Update your post text</small></div>
                  </button>
                  <div className="post-menu-divider"></div>
                  <div className="post-menu-label">Who can see this post?</div>
                  {visibilityOptions.map((option) => (
                    <button key={option.value} type="button" role="menuitemradio" aria-checked={post.visibility === option.value} className={post.visibility === option.value ? "selected" : ""} onClick={() => void changeVisibility(option.value)}>
                      <span className="post-menu-visibility-icon"><VisibilityIcon visibility={option.value} /></span>
                      <div><strong>{option.label}</strong><small>{option.helper}</small></div>
                      {post.visibility === option.value ? <b>✓</b> : null}
                    </button>
                  ))}
                  <div className="post-menu-divider"></div>
                  <button className="danger" type="button" role="menuitem" onClick={() => void deletePost()}>
                    <span>⌫</span><div><strong>Delete post</strong><small>This cannot be undone</small></div>
                  </button>
              </>
            </div>
          ) : null}
        </div>
      </header>

      {editing ? (
        <div className="post-edit-box">
          <textarea maxLength={280} rows={4} value={editValue} onChange={(event) => setEditValue(event.target.value)} autoFocus />
          <div><span>{editValue.length}/280</span><button type="button" className="muted" onClick={() => { setEditing(false); setEditValue(post.text); }}>Cancel</button><button type="button" disabled={!editValue.trim() || postBusy} onClick={() => void savePostEdit()}>{postBusy ? "Saving…" : "Save"}</button></div>
        </div>
      ) : (
        <div className="post-copy"><p>{post.text}</p></div>
      )}

      {post.visual === "creative" ? <CreativeVisual /> : null}
      {post.visual === "quote" ? <QuoteVisual /> : null}
      {post.visual === "poster" ? <PosterVisual /> : null}

      <footer className="post-actions">
        <div
          className={`reaction-action${reactionPickerOpen ? " picker-open" : ""}`}
          ref={reactionRef}
          onPointerEnter={openDesktopReactionPicker}
          onPointerLeave={scheduleDesktopReactionPickerClose}
          onBlur={(event) => { if (!reactionRef.current?.contains(event.relatedTarget as Node | null)) setReactionPickerOpen(false); }}
        >
          <div
            className={`reaction-picker${reactionPickerOpen ? " open" : ""}`}
            role="menu"
            aria-label="Choose a reaction"
            onPointerEnter={openDesktopReactionPicker}
            onPointerLeave={scheduleDesktopReactionPickerClose}
          >
            <div ref={reactionPickerScrollRef} className="reaction-picker-scroll">
              {reactionOptions.map((reaction) => (
                <button
                  key={reaction.type}
                  className={`reaction-option${post.reactionType === reaction.type ? " selected" : ""}`}
                  type="button"
                  role="menuitemradio"
                  aria-checked={post.reactionType === reaction.type}
                  aria-label={reaction.label}
                  title={reaction.label}
                  style={{
                    "--reaction-color": reaction.color,
                    "--reaction-accent": reaction.accent || reaction.color,
                  } as CSSProperties}
                  onClick={(event) => { event.stopPropagation(); chooseReaction(reaction.type); }}
                >
                  <ReactionIcon type={reaction.type} />
                  <span>{reaction.label}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            className="action-btn like-btn reaction-main"
            type="button"
            data-liked={String(post.liked)}
            data-reaction={post.reactionType || "NONE"}
            aria-label={post.reactionType ? `${reactionOptions.find((item) => item.type === post.reactionType)?.label || "Reaction"}. Hold for more reactions.` : "Like. Hold for more reactions."}
            title={post.reactionType ? reactionOptions.find((item) => item.type === post.reactionType)?.label : "Like"}
            style={post.reactionType ? {
              "--reaction-color": reactionOptions.find((item) => item.type === post.reactionType)?.color,
              "--reaction-accent": reactionOptions.find((item) => item.type === post.reactionType)?.accent || reactionOptions.find((item) => item.type === post.reactionType)?.color,
            } as CSSProperties : undefined}
            onPointerDown={handleReactionPointerDown}
            onPointerMove={handleReactionPointerMove}
            onPointerUp={clearReactionHold}
            onPointerCancel={clearReactionHold}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") scheduleDesktopReactionPickerClose(event);
              else clearReactionHold();
            }}
            onContextMenu={(event) => { if (reactionPickerOpen) event.preventDefault(); }}
            onClick={handlePrimaryReaction}
          >
            <ReactionIcon type={post.reactionType || "LIKE"} filled={Boolean(post.reactionType)} />
            <span className="like-count">{count}</span>
          </button>
        </div>
        <button ref={commentToggleRef} className={`action-btn${threadOpen ? " active" : ""}`} type="button" onClick={toggleComments}>
          <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H9l-5 2v-6a4 4 0 0 1-1-3V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7Z"/></svg>
          <span className="comment-count">{post.comments}</span>
        </button>
        <div className={`post-share-wrap${shareOpen ? " open" : ""}`} ref={shareRef}>
          <button
            className={`action-btn${shareOpen ? " active" : ""}`}
            type="button"
            aria-label="Share post"
            aria-expanded={shareOpen}
            onClick={() => setShareOpen((current) => !current)}
          >
            <svg viewBox="0 0 24 24"><path d="m4 12 16-8-6 16-2-6-8-2Z"/><path d="m12 14 8-10"/></svg>
            <span>Share</span>
          </button>

          {shareOpen ? (
            <div className="post-share-sheet" role="dialog" aria-label="Share this post">
              <div className="post-share-head">
                <div>
                  <small>SHARE POST</small>
                  <strong>Send it somewhere good.</strong>
                </div>
                <button type="button" aria-label="Close share options" onClick={() => setShareOpen(false)}>×</button>
              </div>

              <div className="post-share-preview">
                <UserAvatar initials={post.initials} image={post.avatarUrl} theme={post.avatarTheme} />
                <div><strong>{post.name}</strong><p>{post.text || "Gupto post"}</p></div>
              </div>

              <div className="post-share-networks" aria-label="Social networks">
                <button type="button" data-network="facebook" onClick={() => shareToNetwork("facebook")}><span><ShareNetworkIcon network="facebook" /></span><b>Facebook</b></button>
                <button type="button" data-network="x" onClick={() => shareToNetwork("x")}><span><ShareNetworkIcon network="x" /></span><b>X</b></button>
                <button type="button" data-network="whatsapp" onClick={() => shareToNetwork("whatsapp")}><span><ShareNetworkIcon network="whatsapp" /></span><b>WhatsApp</b></button>
                <button type="button" data-network="telegram" onClick={() => shareToNetwork("telegram")}><span><ShareNetworkIcon network="telegram" /></span><b>Telegram</b></button>
              </div>

              <div className="post-share-tools">
                <button type="button" onClick={() => void copyShareLink()}><span><ShareUtilityIcon type="link" /></span><div><b>Copy link</b><small>Direct link to this post</small></div></button>
                <button type="button" onClick={() => void copyPostAndLink()}><span><ShareUtilityIcon type="copy" /></span><div><b>Copy post + link</b><small>Ready to paste anywhere</small></div></button>
                <button type="button" onClick={() => void nativeShare()}><span><ShareUtilityIcon type="more" /></span><div><b>More apps</b><small>Use your device share sheet</small></div></button>
              </div>

              <div className="post-share-privacy">
                <VisibilityIcon visibility={post.visibility} />
                <span>{post.visibility === "PUBLIC" ? "Anyone with the link can open this public post." : post.visibility === "FRIENDS" ? "Only accepted friends can open this post on Gupto." : "This private post can only be opened by you."}</span>
              </div>
            </div>
          ) : null}
        </div>
        <button className={`action-btn bookmark-btn push-right${bookmarked ? " active" : ""}`} type="button" aria-label="Bookmark" onClick={() => onToggleBookmark(post.id)}>
          <svg viewBox="0 0 24 24"><path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z"/></svg>
        </button>
      </footer>

      {threadOpen ? (
        <section ref={threadRef} className="post-thread" aria-label="Comments and replies">
          <div className="post-comment-composer">
            <div className="thread-input-shell">
              <input
                ref={commentInputRef}
                maxLength={500}
                value={commentValue}
                onChange={(event) => setCommentValue(event.target.value)}
                placeholder="Write a comment…"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submitComment();
                  }
                }}
                autoFocus
              />
              <button
                className={`thread-emoji-trigger${emojiPickerTarget === "comment" ? " active" : ""}`}
                data-thread-emoji-trigger
                type="button"
                aria-label="Add emoji to comment"
                aria-expanded={emojiPickerTarget === "comment"}
                title="Add emoji"
                onClick={() => setEmojiPickerTarget((current) => current === "comment" ? null : "comment")}
              >
                <ThreadSmileIcon />
              </button>
              {renderThreadEmojiPicker("comment")}
            </div>
            <button className="thread-submit-btn" type="button" disabled={!commentValue.trim() || commentBusy} onClick={() => void submitComment()}>{commentBusy ? "…" : "Post"}</button>
          </div>

          {commentsLoading ? <div className="post-thread-status">Loading comments…</div> : null}
          {!commentsLoading && commentsLoaded && !comments.length ? <div className="post-thread-status">No comments yet. Start the conversation.</div> : null}

          <div className="post-thread-list">
            {comments.slice(0, visibleCommentCount).map((comment) => {
              const rootTarget: ReplyTarget = { commentId: comment.id, parentReplyId: null, authorName: comment.author.name };
              return (
                <article className="post-comment" key={comment.id}>
                  <ThreadMessage
                    kind="comment"
                    postId={post.id}
                    commentId={comment.id}
                    item={comment}
                    onReply={() => toggleReplyTarget(rootTarget)}
                    onUpdate={(text, wasEdited) => setComments((current) => current.map((item) => item.id === comment.id ? { ...item, text, wasEdited } : item))}
                    onDelete={() => {
                      setComments((current) => current.filter((item) => item.id !== comment.id));
                      onCommentCountChange(post.id, Math.max(0, comments.length - 1));
                      if (replyTarget?.commentId === comment.id) setReplyTarget(null);
                    }}
                    onReactionChange={(reactionType, reactionCount) => setComments((current) => current.map((item) => item.id === comment.id ? { ...item, reactionType, reactionCount } : item))}
                    onShowToast={onShowToast}
                  />

                  {renderReplyComposer(rootTarget)}
                  {renderReplyBranch(comment.id, comment.replies, null)}
                </article>
              );
            })}
          </div>

          {comments.length > visibleCommentCount ? (
            <button className="thread-more-btn comment-more" type="button" onClick={() => setVisibleCommentCount((current) => current + 3)}>
              View {Math.min(3, comments.length - visibleCommentCount)} more {comments.length - visibleCommentCount === 1 ? "comment" : "comments"}
            </button>
          ) : comments.length > 3 && visibleCommentCount >= comments.length ? (
            <button className="thread-more-btn comment-more" type="button" onClick={() => setVisibleCommentCount(3)}>Show fewer comments</button>
          ) : null}
        </section>
      ) : null}
    </article>
  );
}
