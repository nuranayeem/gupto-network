"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { initialPosts } from "@/data/posts";
import type { Post } from "@/types/social";
import MobileHeader from "./MobileHeader";
import Sidebar from "./Sidebar";
import Feed from "./Feed";
import RightPanel from "./RightPanel";
import MobileNav from "./MobileNav";

export default function NexoraApp() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [composerValue, setComposerValue] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => new Set());
  const [following, setFollowing] = useState<Set<string>>(() => new Set());
  const [activeFilter, setActiveFilter] = useState<"for-you" | "following">("for-you");
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 1800);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("nexora-theme");
    document.body.classList.toggle("dark", savedTheme === "dark");

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleTheme = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("nexora-theme", document.body.classList.contains("dark") ? "dark" : "light");
  };

  const focusComposer = () => {
    document.getElementById("composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => composerRef.current?.focus(), 400);
  };

  const handleComposerChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setComposerValue(event.currentTarget.value);
    event.currentTarget.style.height = "auto";
    event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 150)}px`;
  };

  const publishPost = () => {
    const message = composerValue.trim();
    if (!message) return;

    const newPost: Post = {
      id: `user-${Date.now()}`,
      initials: "RS",
      name: "Rashid Sohail",
      handle: "@rashid",
      time: "now",
      text: message,
      visual: "none",
      liked: false,
      likeCount: 0,
      comments: "0",
      isOwn: true,
    };

    setPosts((current) => [newPost, ...current]);
    setComposerValue("");
    if (composerRef.current) composerRef.current.style.height = "auto";
    showToast("Your post is live");
  };

  const toggleLike = (id: string) => {
    setPosts((current) => current.map((post) => {
      if (post.id !== id) return post;
      const nextLiked = !post.liked;
      return {
        ...post,
        liked: nextLiked,
        likeCount: Math.max(post.likeCount + (nextLiked ? 1 : -1), 0),
        displayLikeCount: undefined,
      };
    }));
  };

  const toggleBookmark = (id: string) => {
    setBookmarks((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
        showToast("Removed from bookmarks");
      } else {
        next.add(id);
        showToast("Saved to bookmarks");
      }
      return next;
    });
  };

  const toggleFollow = (name: string) => {
    setFollowing((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const changeFilter = (filter: "for-you" | "following") => {
    setActiveFilter(filter);
    showToast(filter === "following" ? "Following feed selected" : "For you feed selected");
  };

  return (
    <>
      <div className="ambient ambient-one"></div>
      <div className="ambient ambient-two"></div>

      <MobileHeader onToggleTheme={toggleTheme} />

      <div className="app-shell">
        <Sidebar onFocusComposer={focusComposer} />
        <Feed
          posts={posts}
          bookmarks={bookmarks}
          composerValue={composerValue}
          composerRef={composerRef}
          activeFilter={activeFilter}
          onToggleTheme={toggleTheme}
          onComposerChange={handleComposerChange}
          onPublish={publishPost}
          onToggleLike={toggleLike}
          onToggleBookmark={toggleBookmark}
          onFilterChange={changeFilter}
        />
        <RightPanel searchRef={searchRef} following={following} onToggleFollow={toggleFollow} />
      </div>

      <MobileNav onFocusComposer={focusComposer} />

      <div className={`toast${toastVisible ? " show" : ""}`} id="toast" role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}
