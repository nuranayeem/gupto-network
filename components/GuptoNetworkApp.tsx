"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import type { Post } from "@/types/social";
import type { CurrentUser } from "@/types/current-user";
import MobileHeader from "./MobileHeader";
import Sidebar from "./Sidebar";
import Feed from "./Feed";
import ProfileView from "./ProfileView";
import RightPanel from "./RightPanel";
import MobileNav from "./MobileNav";

type GuptoNetworkAppProps = {
  currentUser: CurrentUser;
  initialPosts: Post[];
  initialProfilePosts: Post[];
};

const knownSections = new Set([
  "home",
  "discover",
  "messages",
  "notifications",
  "bookmarks",
  "profile",
  "feed-control",
  "requests",
  "circles",
  "settings",
]);

export default function GuptoNetworkApp({ currentUser, initialPosts, initialProfilePosts }: GuptoNetworkAppProps) {
  const [user, setUser] = useState(currentUser);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [profilePosts, setProfilePosts] = useState<Post[]>(initialProfilePosts);
  const [composerValue, setComposerValue] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => new Set());
  const [following, setFollowing] = useState<Set<string>>(() => new Set());
  const [activeFilter, setActiveFilter] = useState<"for-you" | "following">("for-you");
  const [activeSection, setActiveSection] = useState("home");
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
    const savedTheme = localStorage.getItem("gupto-network-theme");
    document.body.classList.toggle("dark", savedTheme === "dark");

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const syncSectionFromHash = () => {
      const section = window.location.hash.replace(/^#/, "") || "home";
      setActiveSection(knownSections.has(section) ? section : "home");
    };

    syncSectionFromHash();
    window.addEventListener("hashchange", syncSectionFromHash);
    return () => window.removeEventListener("hashchange", syncSectionFromHash);
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
    localStorage.setItem("gupto-network-theme", document.body.classList.contains("dark") ? "dark" : "light");
  };

  const openProfile = () => {
    window.location.hash = "profile";
    setActiveSection("profile");
  };

  const focusComposer = () => {
    if (activeSection !== "home") {
      window.location.hash = "home";
      setActiveSection("home");
    }

    window.setTimeout(() => {
      document.getElementById("composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => composerRef.current?.focus(), 250);
    }, activeSection === "home" ? 0 : 80);
  };

  const handleComposerChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setComposerValue(event.currentTarget.value);
    event.currentTarget.style.height = "auto";
    event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 150)}px`;
  };

  const publishPost = async () => {
    const message = composerValue.trim();
    if (!message || isPublishing) return;

    setIsPublishing(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: message }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { post?: Post; error?: string }
        | null;

      if (!response.ok || !payload?.post) {
        showToast(payload?.error || "Could not publish your post");
        return;
      }

      const post = payload.post as Post;
      setPosts((current) => [post, ...current]);
      setProfilePosts((current) => [post, ...current]);
      setUser((current) => ({ ...current, postCount: current.postCount + 1 }));
      setComposerValue("");
      if (composerRef.current) composerRef.current.style.height = "auto";
      showToast("Your post is live");
    } catch {
      showToast("Could not publish your post");
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleLike = (id: string) => {
    const update = (current: Post[]) => current.map((post) => {
      if (post.id !== id) return post;
      const nextLiked = !post.liked;
      return {
        ...post,
        liked: nextLiked,
        likeCount: Math.max(post.likeCount + (nextLiked ? 1 : -1), 0),
        displayLikeCount: undefined,
      };
    });

    setPosts(update);
    setProfilePosts(update);
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

  const handleProfileUpdated = (nextUser: CurrentUser) => {
    setUser(nextUser);

    const refreshOwnPostIdentity = (current: Post[]) => current.map((post) => post.isOwn ? {
      ...post,
      initials: nextUser.initials,
      avatarUrl: nextUser.image,
      avatarTheme: nextUser.avatarTheme,
      name: nextUser.name,
      handle: `@${nextUser.username}`,
    } : post);

    setPosts(refreshOwnPostIdentity);
    setProfilePosts(refreshOwnPostIdentity);
  };

  const centerContent = activeSection === "profile" ? (
    <ProfileView
      currentUser={user}
      posts={profilePosts}
      bookmarks={bookmarks}
      onToggleTheme={toggleTheme}
      onToggleLike={toggleLike}
      onToggleBookmark={toggleBookmark}
      onProfileUpdated={handleProfileUpdated}
      onShowToast={showToast}
    />
  ) : (
    <Feed
      posts={posts}
      bookmarks={bookmarks}
      composerValue={composerValue}
      composerRef={composerRef}
      activeFilter={activeFilter}
      currentUser={user}
      onToggleTheme={toggleTheme}
      onComposerChange={handleComposerChange}
      onPublish={publishPost}
      isPublishing={isPublishing}
      onToggleLike={toggleLike}
      onToggleBookmark={toggleBookmark}
      onFilterChange={changeFilter}
    />
  );

  return (
    <>
      <div className="ambient ambient-one"></div>
      <div className="ambient ambient-two"></div>

      <MobileHeader onToggleTheme={toggleTheme} onOpenProfile={openProfile} currentUser={user} />

      <div className="app-shell">
        <Sidebar onFocusComposer={focusComposer} currentUser={user} activeSection={activeSection} />
        {centerContent}
        <RightPanel searchRef={searchRef} following={following} onToggleFollow={toggleFollow} />
      </div>

      <MobileNav onFocusComposer={focusComposer} activeSection={activeSection} />

      <div className={`toast${toastVisible ? " show" : ""}`} id="toast" role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}
