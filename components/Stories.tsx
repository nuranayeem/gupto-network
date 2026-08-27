import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CurrentUser, AvatarTheme } from "@/types/current-user";
import type { StoryBundle } from "@/types/story";
import UserAvatar from "./UserAvatar";
import StoryStudio from "./StoryStudio";

const demoProfiles = [
  ["Ariana", "AK", "violet"], ["Jovan", "JN", "mint"], ["Maya", "MT", "sunset"],
  ["Zara", "ZR", "blue"], ["Lucas", "LU", "rose"], ["Nora", "NR", "aqua"],
  ["Rafi", "RF", "amber"], ["Tisha", "TS", "coral"], ["Arman", "AR", "violet"],
  ["Elina", "EL", "blue"], ["Sami", "SM", "mint"], ["Nadia", "ND", "sunset"],
] as const;

type StoriesProps = {
  currentUser: CurrentUser;
  onOwnStoryStatusChange?: (active: boolean) => void;
};

export default function Stories({ currentUser, onOwnStoryStatusChange }: StoriesProps) {
  const storiesRef = useRef<HTMLElement | null>(null);
  const storyTrackRef = useRef<HTMLDivElement | null>(null);
  const [bundles, setBundles] = useState<StoryBundle[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [viewerBundleIndex, setViewerBundleIndex] = useState<number | null>(null);

  const loadStories = useCallback(async () => {
    const response = await fetch("/api/stories", { cache: "no-store" }).catch(() => null);
    if (!response?.ok) return [] as StoryBundle[];
    const payload = await response.json().catch(() => null) as { bundles?: StoryBundle[] } | null;
    const next = payload?.bundles || [];
    setBundles(next);
    onOwnStoryStatusChange?.(next.some((bundle) => bundle.author.isOwn && bundle.stories.length > 0));
    return next;
  }, [onOwnStoryStatusChange]);

  useEffect(() => { void loadStories(); }, [loadStories]);

  useEffect(() => {
    const openOwnStory = async () => {
      const available = bundles.length ? bundles : await loadStories();
      const ownIndex = available.findIndex((bundle) => bundle.author.isOwn && bundle.stories.length > 0);
      if (ownIndex >= 0) setViewerBundleIndex(ownIndex);
      else setComposerOpen(true);
    };
    window.addEventListener("gupto:open-own-story", openOwnStory);
    return () => window.removeEventListener("gupto:open-own-story", openOwnStory);
  }, [bundles, loadStories]);

  useEffect(() => {
    const storyShell = storiesRef.current;
    const storyTrack = storyTrackRef.current;
    if (!storyShell || !storyTrack) return;

    const handleStoryWheel = (event: WheelEvent) => {
      event.preventDefault();
      const firstStory = storyTrack.querySelector<HTMLElement>(".story");
      const styles = window.getComputedStyle(storyTrack);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
      const step = (firstStory?.getBoundingClientRect().width || 82) + gap;
      const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;

      storyTrack.scrollBy({
        left: delta > 0 ? step : -step,
        behavior: "smooth",
      });
    };

    storyShell.addEventListener("wheel", handleStoryWheel, { passive: false });
    return () => storyShell.removeEventListener("wheel", handleStoryWheel);
  }, []);

  const ownBundle = bundles.find((bundle) => bundle.author.isOwn);
  const latestOwnStory = ownBundle?.stories[ownBundle.stories.length - 1];
  const ownStoryCoverStyle = ownBundle?.latestPreview
    ? { backgroundImage: `linear-gradient(180deg, transparent 34%, rgba(17,18,30,.82)), url(${ownBundle.latestPreview})` }
    : undefined;
  const realOtherBundles = bundles.filter((bundle) => !bundle.author.isOwn && bundle.stories.length > 0);
  const cards = useMemo(() => realOtherBundles.length ? realOtherBundles : demoProfiles.map(([name, demoInitials, accent], index) => ({
    author: { id: `demo-${index}`, name, username: name.toLowerCase(), initials: demoInitials, image: null, avatarTheme: "violet" as AvatarTheme, isOwn: false },
    stories: [], hasUnseen: true, latestPreview: null, latestAccent: accent,
  })), [realOtherBundles]);

  const openOwn = () => {
    if (ownBundle?.stories.length) {
      const index = bundles.findIndex((bundle) => bundle.author.isOwn);
      setViewerBundleIndex(index);
    } else setComposerOpen(true);
  };

  const openBundle = (bundle: StoryBundle) => {
    if (!bundle.stories.length) return;
    const index = bundles.findIndex((item) => item.author.id === bundle.author.id);
    if (index >= 0) setViewerBundleIndex(index);
  };

  return (
    <>
      <section ref={storiesRef} className="stories card" aria-label="Stories">
        <div className="story story-create story-fixed">
          <button
            className={`story-cover story-cover-owner${ownBundle?.stories.length ? ` story-cover-${ownBundle.latestAccent}` : ""}`}
            style={ownStoryCoverStyle}
            type="button"
            onClick={() => setComposerOpen(true)}
            aria-label="Create your story"
          >
            <UserAvatar initials={currentUser.initials} image={currentUser.image} theme={currentUser.avatarTheme} className="story-cover-owner-photo" />
            {latestOwnStory?.mediaType === "MUSIC" ? (
              <span className="story-cover-music-preview" aria-hidden="true">
                <i className="story-cover-music-icon">♫</i>
                <span className="story-cover-music-bars">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => <i key={bar} style={{ "--bar": bar } as CSSProperties} />)}
                </span>
                <strong>{latestOwnStory.musicTitle || "Music"}</strong>
              </span>
            ) : null}
            <span className="story-cover-label">Create story</span>
          </button>
          <button className="story-add-badge" type="button" onClick={() => setComposerOpen(true)} aria-label="Add another story">
            +
          </button>
        </div>
        <div ref={storyTrackRef} className="stories-track">
          {ownBundle?.stories.length ? (
            <button className={`story${ownBundle.hasUnseen ? " has-unseen" : ""}`} type="button" onClick={openOwn} aria-label="View your story">
              <span className={`story-cover story-cover-owner story-cover-${ownBundle.latestAccent}`} style={ownStoryCoverStyle}>
                <UserAvatar initials={currentUser.initials} image={currentUser.image} theme={currentUser.avatarTheme} className="story-profile-badge" />
                <span className="story-live-dot" aria-hidden="true" />
                {latestOwnStory?.mediaType === "MUSIC" ? (
                  <span className="story-cover-music-preview" aria-hidden="true">
                    <i className="story-cover-music-icon">♫</i>
                    <span className="story-cover-music-bars">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => <i key={bar} style={{ "--bar": bar } as CSSProperties} />)}
                    </span>
                    <strong>{latestOwnStory.musicTitle || "Music"}</strong>
                  </span>
                ) : null}
                <span className="story-cover-label">Your story</span>
              </span>
            </button>
          ) : null}
          {cards.map((bundle) => (
            <button className={`story${bundle.hasUnseen ? " has-unseen" : ""}`} type="button" key={bundle.author.id} onClick={() => openBundle(bundle)} aria-label={`View ${bundle.author.name}'s story`}>
              <span className={`story-cover story-cover-${bundle.latestAccent}`} style={bundle.latestPreview ? { backgroundImage: `linear-gradient(180deg, transparent 34%, rgba(17,18,30,.82)), url(${bundle.latestPreview})` } : undefined}>
                <span className="story-cover-art" aria-hidden="true" />
                {bundle.author.image ? <UserAvatar initials={bundle.author.initials} image={bundle.author.image} theme={bundle.author.avatarTheme} className="story-profile-badge" /> : <span className="story-profile-badge">{bundle.author.initials}</span>}
                <span className="story-live-dot" aria-hidden="true" />
                <span className="story-cover-label">{bundle.author.name}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
      <StoryStudio currentUser={currentUser} bundles={bundles} composerOpen={composerOpen} viewerBundleIndex={viewerBundleIndex} onCloseComposer={() => setComposerOpen(false)} onCloseViewer={() => setViewerBundleIndex(null)} onOpenComposer={() => setComposerOpen(true)} onViewerBundleChange={setViewerBundleIndex} onChanged={async () => { await loadStories(); }} />
    </>
  );
}
