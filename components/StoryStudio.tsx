"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import type { CurrentUser } from "@/types/current-user";
import { DEFAULT_STORY_CAPTION_STYLE, DEFAULT_STORY_MEDIA_TRANSFORM, type StoryAudience, type StoryBundle, type StoryCaptionStyle, type StoryMediaTransform, type StoryMediaType } from "@/types/story";
import UserAvatar from "./UserAvatar";
import StoryMediaEditor, { storyFrameClass, storyMediaStyle } from "./StoryMediaEditor";

type StoryStudioProps = {
  currentUser: CurrentUser;
  bundles: StoryBundle[];
  composerOpen: boolean;
  viewerBundleIndex: number | null;
  onCloseComposer: () => void;
  onCloseViewer: () => void;
  onOpenComposer: () => void;
  onViewerBundleChange: (index: number | null) => void;
  onChanged: () => Promise<void> | void;
};

const accents = ["none", "violet", "mint", "sunset", "blue", "rose", "aqua", "amber", "coral"];
const captionColors = ["#ffffff", "#171922", "#ffe45c", "#ff78a8", "#66e3c4", "#71b7ff"];
const captionBackgroundColors = ["#171922", "#6f4cff", "#e94f7c", "#08796d", "#285ca8", "#ffffff"];
type MusicDurationLimit = "FULL" | 10 | 20 | 30 | 60;
type StoryColorPalette = [string, string, string];
const DEFAULT_STORY_PALETTE: StoryColorPalette = ["#4b3d36", "#766052", "#b3927c"];

function paletteBackground(colors: StoryColorPalette) {
  return { background: `radial-gradient(circle at 18% 18%, ${colors[1]} 0%, transparent 48%), radial-gradient(circle at 82% 78%, ${colors[2]} 0%, transparent 52%), linear-gradient(145deg, ${colors[0]}, ${colors[1]} 52%, ${colors[2]})` } as CSSProperties;
}

async function extractStoryPalette(file: File): Promise<StoryColorPalette> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = 32; canvas.height = 32;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) { bitmap.close(); return DEFAULT_STORY_PALETTE; }
  context.drawImage(bitmap, 0, 0, 32, 32); bitmap.close();
  const pixels = context.getImageData(0, 0, 32, 32).data;
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
  for (let index = 0; index < pixels.length; index += 16) {
    if (pixels[index + 3] < 180) continue;
    const r = Math.round(pixels[index] / 32) * 32;
    const g = Math.round(pixels[index + 1] / 32) * 32;
    const b = Math.round(pixels[index + 2] / 32) * 32;
    const key = `${r},${g},${b}`;
    const current = buckets.get(key) || { count: 0, r, g, b };
    current.count += 1; buckets.set(key, current);
  }
  const candidates = [...buckets.values()].sort((a, b) => b.count - a.count);
  const selected: typeof candidates = [];
  for (const color of candidates) {
    if (selected.every((picked) => Math.hypot(color.r - picked.r, color.g - picked.g, color.b - picked.b) > 58)) selected.push(color);
    if (selected.length === 3) break;
  }
  while (selected.length < 3) selected.push(candidates[selected.length] || { count: 1, r: 92 + selected.length * 34, g: 74 + selected.length * 26, b: 68 + selected.length * 20 });
  const toHex = (color: { r: number; g: number; b: number }) => `#${[color.r, color.g, color.b].map((value) => Math.min(255, value).toString(16).padStart(2, "0")).join("")}`;
  return [toHex(selected[0]), toHex(selected[1]), toHex(selected[2])];
}

function resolvedMusicDuration(limit: MusicDurationLimit, trackDuration: number) {
  return limit === "FULL" ? trackDuration : Math.min(limit, trackDuration);
}

function formatAudioTime(value: number) {
  const seconds = Math.max(0, Math.floor(value));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function MusicVisualizer({ title, viewer = false }: { title: string; viewer?: boolean }) {
  return <div className={viewer ? "story-viewer-music story-music-visualizer" : "story-music-canvas story-music-visualizer"}>
    <span>♫</span>
    <div className="story-music-bars" aria-hidden="true">{[1,2,3,4,5,6,7,8,9,10,11,12].map((bar) => <i key={bar} style={{ "--bar": bar } as CSSProperties} />)}</div>
    <strong>{title}</strong>{viewer ? <small>Playing the full track</small> : null}
  </div>;
}

function captionClassName(style: StoryCaptionStyle, text: string) {
  const autoSize = text.length > 120 ? "compact" : text.length > 70 ? "balanced" : "short";
  return `story-caption story-caption-font-${style.font.toLowerCase()} story-caption-size-${style.size.toLowerCase()} story-caption-align-${style.align.toLowerCase()} story-caption-bg-${style.background.toLowerCase()} story-caption-auto-${autoSize}`;
}

function captionCoordinates(style: StoryCaptionStyle) {
  if (style.position === "TOP") return { x: 50, y: 15 };
  if (style.position === "BOTTOM") return { x: 50, y: 82 };
  if (style.position === "LEFT") return { x: 25, y: 50 };
  if (style.position === "RIGHT") return { x: 75, y: 50 };
  if (style.position === "CENTER") return { x: 50, y: 50 };
  return { x: style.offsetX, y: style.offsetY };
}

function captionInlineStyle(style: StoryCaptionStyle) {
  const { x, y } = captionCoordinates(style);
  return {
    color: style.color,
    fontWeight: style.bold ? 800 : 500,
    fontStyle: style.italic ? "italic" : "normal",
    fontSize: `${style.fontSize}px`,
    "--story-caption-bg": style.backgroundColor,
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(-50%, -50%) rotate(${style.rotation}deg)`,
    maxWidth: style.position === "LEFT" || style.position === "RIGHT" ? "46%" : undefined,
  } as CSSProperties;
}

const clampCaptionPosition = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

type AppleSelectValue = string | number;
type AppleSelectOption<T extends AppleSelectValue> = { value: T; label: string };

function AppleSelect<T extends AppleSelectValue>({ value, options, onChange, ariaLabel, prefix }: { value: T; options: AppleSelectOption<T>[]; onChange: (value: T) => void; ariaLabel: string; prefix?: string }) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, options.findIndex((option) => option.value === value)));
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggle = () => {
    if (!open && rootRef.current) {
      const bounds = rootRef.current.getBoundingClientRect();
      setDropUp(window.innerHeight - bounds.bottom < 230 && bounds.top > window.innerHeight - bounds.bottom);
      setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)));
    }
    setOpen((current) => !current);
  };

  const choose = (option: AppleSelectOption<T>) => {
    onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") { setOpen(false); return; }
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); return; }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    if (!open) { toggle(); return; }
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const next = (activeIndex + direction + options.length) % options.length;
    setActiveIndex(next);
    options[next] && onChange(options[next].value);
  };

  return (
    <div ref={rootRef} className={`story-apple-select${open ? " open" : ""}${dropUp ? " drop-up" : ""}`}>
      <button type="button" className="story-apple-trigger" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={toggle} onKeyDown={onKeyDown}>
        <span>{prefix ? <small>{prefix}</small> : null}{selected?.label}</span><i aria-hidden="true"><svg viewBox="0 0 20 20"><path d="m5.5 7.75 4.5 4.5 4.5-4.5" /></svg></i>
      </button>
      {open ? <div className="story-apple-menu" role="listbox" aria-label={ariaLabel}>{options.map((option, index) => <button type="button" role="option" aria-selected={option.value === value} key={String(option.value)} className={`${option.value === value ? "selected" : ""}${index === activeIndex ? " active" : ""}`} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(option)}><span>{option.label}</span>{option.value === value ? <b aria-hidden="true">✓</b> : null}</button>)}</div> : null}
    </div>
  );
}

function FontAwesomeTrashCanIcon() {
  return (
    <svg viewBox="0 0 448 512" aria-hidden="true" focusable="false">
      <path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 80V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16s-16 7.2-16 16zm80 0V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16s-16 7.2-16 16zm80 0V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16s-16 7.2-16 16z" />
    </svg>
  );
}

function StoryViewerAddIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14" /></svg>;
}

function StoryViewerSoundIcon({ muted }: { muted: boolean }) {
  return muted
    ? <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M11 5 6.8 8.5H3.5v7h3.3L11 19V5Z" /><path d="m15.5 9.5 5 5m0-5-5 5" /></svg>
    : <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M11 5 6.8 8.5H3.5v7h3.3L11 19V5Z" /><path d="M15 8.5a5 5 0 0 1 0 7M17.8 5.8a8.8 8.8 0 0 1 0 12.4" /></svg>;
}

export default function StoryStudio({
  currentUser,
  bundles,
  composerOpen,
  viewerBundleIndex,
  onCloseComposer,
  onCloseViewer,
  onOpenComposer,
  onViewerBundleChange,
  onChanged,
}: StoryStudioProps) {
  const [mediaType, setMediaType] = useState<StoryMediaType>("PHOTO");
  const [media, setMedia] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [audioTrackDuration, setAudioTrackDuration] = useState(0);
  const [audioStartSeconds, setAudioStartSeconds] = useState(0);
  const [audioClipDuration, setAudioClipDuration] = useState(20);
  const [musicDurationLimit, setMusicDurationLimit] = useState<MusicDurationLimit>("FULL");
  const [mediaPalette, setMediaPalette] = useState<StoryColorPalette>(DEFAULT_STORY_PALETTE);
  const [mediaTransform, setMediaTransform] = useState<StoryMediaTransform>({ ...DEFAULT_STORY_MEDIA_TRANSFORM });
  const [mediaEditorOpen, setMediaEditorOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [captionStyle, setCaptionStyle] = useState<StoryCaptionStyle>({ ...DEFAULT_STORY_CAPTION_STYLE });
  const [musicTitle, setMusicTitle] = useState("");
  const [accent, setAccent] = useState("violet");
  const [audience, setAudience] = useState<StoryAudience>("PUBLIC");
  const [durationSeconds, setDurationSeconds] = useState(7);
  const [lifetimeHours, setLifetimeHours] = useState(24);
  const [allowReplies, setAllowReplies] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");
  const [storyIndex, setStoryIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const viewerAudioRef = useRef<HTMLAudioElement>(null);
  const captionCanvasRef = useRef<HTMLDivElement>(null);
  const studioControlsRef = useRef<HTMLDivElement>(null);
  const captionDragRef = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  const previewUrl = useMemo(() => media ? URL.createObjectURL(media) : "", [media]);
  const audioPreviewUrl = useMemo(() => audio ? URL.createObjectURL(audio) : "", [audio]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
  }, [previewUrl, audioPreviewUrl]);

  useEffect(() => {
    if (!composerOpen && viewerBundleIndex === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [composerOpen, viewerBundleIndex]);

  useEffect(() => {
    setStoryIndex(0);
    setProgressKey((value) => value + 1);
  }, [viewerBundleIndex]);

  const activeBundle = viewerBundleIndex === null ? null : bundles[viewerBundleIndex] || null;
  const activeStory = activeBundle?.stories[storyIndex] || null;
  const viewerSoundAvailable = Boolean(activeStory && (activeStory.mediaType === "VIDEO" || activeStory.audioUrl));

  useEffect(() => {
    setIsMuted(false);
  }, [activeStory?.id]);

  useEffect(() => {
    if (!activeStory) return;
    void fetch(`/api/stories/${activeStory.id}/view`, { method: "POST" });
    if (activeStory.mediaType === "VIDEO") return;
    const timer = window.setTimeout(() => {
      if (!activeBundle) return;
      if (storyIndex < activeBundle.stories.length - 1) {
        setStoryIndex((value) => value + 1);
        setProgressKey((value) => value + 1);
      } else if (viewerBundleIndex !== null && viewerBundleIndex < bundles.length - 1) {
        onViewerBundleChange(viewerBundleIndex + 1);
      } else {
        onCloseViewer();
      }
    }, activeStory.durationSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [activeStory, activeBundle, storyIndex, viewerBundleIndex, bundles.length, onViewerBundleChange, onCloseViewer]);

  const resetComposer = () => {
    setMediaType("PHOTO"); setMedia(null); setAudio(null); setAudioTrackDuration(0); setAudioStartSeconds(0); setAudioClipDuration(20); setMusicDurationLimit("FULL"); setMediaPalette(DEFAULT_STORY_PALETTE); setMediaTransform({ ...DEFAULT_STORY_MEDIA_TRANSFORM }); setMediaEditorOpen(false); setCaption(""); setCaptionStyle({ ...DEFAULT_STORY_CAPTION_STYLE }); setMusicTitle("");
    setAccent("violet"); setAudience("PUBLIC"); setDurationSeconds(7); setLifetimeHours(24);
    setAllowReplies(true); setError("");
  };

  const chooseMedia = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const visual = files.find((file) => file.type.startsWith("image/") || file.type.startsWith("video/")) || null;
    const soundtrack = files.find((file) => file.type.startsWith("audio/")) || null;

    if (!visual && !soundtrack) {
      setError("Choose a photo, video or music file.");
      event.target.value = "";
      return;
    }

    const nextVisual = visual || media;
    const nextSoundtrack = soundtrack || audio;
    setMedia(nextVisual);
    setAudio(nextSoundtrack);
    if (soundtrack) setMusicDurationLimit("FULL");
    setMediaType(nextVisual?.type.startsWith("video/") ? "VIDEO" : nextVisual && nextSoundtrack ? "PHOTO_MUSIC" : nextVisual ? "PHOTO" : "MUSIC");
    if (visual) {
      setMediaTransform({ ...DEFAULT_STORY_MEDIA_TRANSFORM });
      if (visual.type.startsWith("image/")) {
        setAccent("none");
        void extractStoryPalette(visual).then(setMediaPalette).catch(() => setMediaPalette(DEFAULT_STORY_PALETTE));
      }
      if (nextSoundtrack && audioTrackDuration > 0) {
        setAudioStartSeconds(0);
        setAudioClipDuration(Math.min(20, audioTrackDuration));
      }
    }
    setMediaEditorOpen(Boolean(visual));
    setError("");
    event.target.value = "";
  };

  const removeVisualMedia = () => {
    setMedia(null);
    setMediaPalette(DEFAULT_STORY_PALETTE);
    setMediaTransform({ ...DEFAULT_STORY_MEDIA_TRANSFORM });
    setMediaEditorOpen(false);
    setMediaType(audio ? "MUSIC" : "PHOTO");
    if (audio && audioTrackDuration > 0) {
      setAudioStartSeconds(0);
      setAudioClipDuration(resolvedMusicDuration(musicDurationLimit, audioTrackDuration));
    }
    setError("");
  };

  const removeAudio = () => {
    setAudio(null);
    setAudioTrackDuration(0);
    setAudioStartSeconds(0);
    setAudioClipDuration(20);
    setMusicDurationLimit("FULL");
    setMusicTitle("");
    setMediaType(media?.type.startsWith("video/") ? "VIDEO" : media ? "PHOTO" : "PHOTO");
    setError("");
  };

  const chooseAudio = (event: ChangeEvent<HTMLInputElement>) => {
    const soundtrack = Array.from(event.target.files || []).find((file) => file.type.startsWith("audio/")) || null;
    if (!soundtrack) {
      setError("Choose a valid music file.");
      event.target.value = "";
      return;
    }
    setAudio(soundtrack);
    setAudioTrackDuration(0);
    setAudioStartSeconds(0);
    setAudioClipDuration(20);
    setMusicDurationLimit("FULL");
    setMediaType(media?.type.startsWith("video/") ? "VIDEO" : media ? "PHOTO_MUSIC" : "MUSIC");
    setError("");
    event.target.value = "";
  };

  const syncPreviewAudio = () => {
    const player = previewAudioRef.current;
    if (!player) return;
    player.currentTime = audioStartSeconds;
    void player.play().catch(() => undefined);
  };

  const loopAudioClip = (player: HTMLAudioElement, start: number, duration: number) => {
    if (player.currentTime >= start + duration || player.currentTime < start) {
      player.currentTime = start;
      void player.play().catch(() => undefined);
    }
  };

  const beginCaptionDrag = (event: ReactPointerEvent<HTMLParagraphElement>) => {
    if (!captionCanvasRef.current) return;
    const coordinates = captionCoordinates(captionStyle);
    captionDragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, baseX: coordinates.x, baseY: coordinates.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    setCaptionStyle((current) => ({ ...current, position: "CUSTOM", offsetX: coordinates.x, offsetY: coordinates.y }));
  };

  const moveCaption = (event: ReactPointerEvent<HTMLParagraphElement>) => {
    const drag = captionDragRef.current;
    const canvas = captionCanvasRef.current;
    if (!drag || !canvas || drag.pointerId !== event.pointerId) return;
    const bounds = canvas.getBoundingClientRect();
    const captionBounds = event.currentTarget.getBoundingClientRect();
    const safeX = Math.min(46, Math.max(8, (captionBounds.width / 2 / bounds.width) * 100));
    const safeY = Math.min(42, Math.max(8, (captionBounds.height / 2 / bounds.height) * 100));
    setCaptionStyle((current) => ({
      ...current,
      position: "CUSTOM",
      offsetX: clampCaptionPosition(drag.baseX + ((event.clientX - drag.startX) / bounds.width) * 100, safeX, 100 - safeX),
      offsetY: clampCaptionPosition(drag.baseY + ((event.clientY - drag.startY) / bounds.height) * 100, safeY, 100 - safeY),
    }));
  };

  const endCaptionDrag = (event: ReactPointerEvent<HTMLParagraphElement>) => {
    if (captionDragRef.current?.pointerId === event.pointerId) captionDragRef.current = null;
  };

  const scrollStudioControls = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches) return;
    if (event.target instanceof Element && event.target.closest(".story-apple-menu")) return;
    const controls = studioControlsRef.current;
    if (!controls || event.deltaY === 0) return;
    event.preventDefault();
    controls.scrollTop += event.deltaY;
  };

  const publish = async () => {
    if (isPublishing) return;
    if (!media && !audio) {
      setError("Choose media first.");
      return;
    }
    if ((mediaType === "PHOTO" || mediaType === "VIDEO" || mediaType === "PHOTO_MUSIC") && !media) {
      setError(mediaType === "VIDEO" ? "Choose a video first." : "Choose a photo first.");
      return;
    }
    if ((mediaType === "MUSIC" || mediaType === "PHOTO_MUSIC") && !audio) {
      setError("Choose music first.");
      return;
    }

    setIsPublishing(true);
    setError("");
    const body = new FormData();
    body.set("mediaType", mediaType);
    body.set("audience", audience);
    body.set("accent", accent);
    body.set("backgroundColorA", mediaPalette[0]);
    body.set("backgroundColorB", mediaPalette[1]);
    body.set("backgroundColorC", mediaPalette[2]);
    body.set("caption", mediaType === "MUSIC" ? "" : caption);
    body.set("captionFont", captionStyle.font);
    body.set("captionSize", captionStyle.size);
    body.set("captionFontSize", String(captionStyle.fontSize));
    body.set("captionAlign", captionStyle.align);
    body.set("captionBold", String(captionStyle.bold));
    body.set("captionItalic", String(captionStyle.italic));
    body.set("captionColor", captionStyle.color);
    body.set("captionBg", captionStyle.background);
    body.set("captionBgColor", captionStyle.backgroundColor);
    body.set("captionPosition", captionStyle.position);
    body.set("captionOffsetX", String(captionStyle.offsetX));
    body.set("captionOffsetY", String(captionStyle.offsetY));
    body.set("captionRotation", String(captionStyle.rotation));
    body.set("musicTitle", musicTitle);
    body.set("audioStartSeconds", String(audioStartSeconds));
    body.set("audioDurationSeconds", String(audioClipDuration));
    body.set("durationSeconds", String(audio ? audioClipDuration : durationSeconds));
    body.set("lifetimeHours", String(lifetimeHours));
    body.set("allowReplies", String(allowReplies));
    body.set("mediaScale", String(mediaTransform.scale));
    body.set("mediaRotation", String(mediaTransform.rotation));
    body.set("mediaFlipX", String(mediaTransform.flipX));
    body.set("mediaFlipY", String(mediaTransform.flipY));
    body.set("mediaOffsetX", String(mediaTransform.offsetX));
    body.set("mediaOffsetY", String(mediaTransform.offsetY));
    body.set("mediaFit", mediaTransform.fit);
    body.set("mediaFrame", mediaTransform.frame);
    if (media) body.set("media", media);
    if (audio) body.set("audio", audio);

    try {
      const response = await fetch("/api/stories", { method: "POST", body });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error || "Could not publish your story.");
        return;
      }
      await onChanged();
      resetComposer();
      onCloseComposer();
    } catch {
      setError("Could not publish your story. Check your connection.");
    } finally {
      setIsPublishing(false);
    }
  };

  const deleteStory = async () => {
    if (!activeStory || isDeleting) return;
    setIsDeleting(true);
    const response = await fetch(`/api/stories/${activeStory.id}`, { method: "DELETE" }).catch(() => null);
    if (response?.ok) {
      await onChanged();
      onCloseViewer();
    }
    setIsDeleting(false);
  };

  const moveViewer = (direction: -1 | 1) => {
    if (!activeBundle || viewerBundleIndex === null) return;
    const nextStory = storyIndex + direction;
    if (nextStory >= 0 && nextStory < activeBundle.stories.length) {
      setStoryIndex(nextStory);
      setProgressKey((value) => value + 1);
      return;
    }
    const nextBundle = viewerBundleIndex + direction;
    if (nextBundle >= 0 && nextBundle < bundles.length) onViewerBundleChange(nextBundle);
  };

  return (
    <>
      {composerOpen ? (
        <div className="story-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCloseComposer()}>
          <section className="story-studio" role="dialog" aria-modal="true" aria-labelledby="storyStudioTitle">
            <header className="story-studio-header">
              <button type="button" className="story-circle-btn" onClick={onCloseComposer} aria-label="Close">×</button>
              <div><span>GUPTO STORY</span><h2 id="storyStudioTitle">Create a moment</h2></div>
              <button type="button" className="story-publish-btn" disabled={isPublishing} onClick={publish}>{isPublishing ? "Sharing…" : "Share"}</button>
            </header>

            <div className="story-studio-body" onWheel={scrollStudioControls}>
              <div className="story-studio-preview-wrap">
                <div ref={captionCanvasRef} className={`story-studio-preview story-accent-${accent}`}>
                  {previewUrl && accent === "none" ? <div className="story-color-backdrop" style={paletteBackground(mediaPalette)} aria-hidden="true" /> : null}
                  {previewUrl ? <div className={`story-preview-media-frame ${storyFrameClass(mediaTransform.frame)}`}>{mediaType === "VIDEO" ? <video src={previewUrl} style={storyMediaStyle(mediaTransform)} muted autoPlay loop playsInline /> : <img src={previewUrl} style={storyMediaStyle(mediaTransform)} alt="Story preview" />}</div> : null}
                  {!previewUrl ? audio ? <MusicVisualizer title={musicTitle || audio.name.replace(/\.[^.]+$/, "") || "Your sound, your space"} /> : <div className="story-music-canvas story-music-static"><span>♫</span><strong>Your sound, your space</strong></div> : null}
                  {caption && mediaType !== "MUSIC" ? <p className={captionClassName(captionStyle, caption)} style={captionInlineStyle(captionStyle)} onPointerDown={beginCaptionDrag} onPointerMove={moveCaption} onPointerUp={endCaptionDrag} onPointerCancel={endCaptionDrag} title="Drag to place your caption">{caption}</p> : null}
                  {(audio || mediaType === "MUSIC" || mediaType === "PHOTO_MUSIC") ? <div className="story-audio-chip">♫ {musicTitle || audio?.name.replace(/\.[^.]+$/, "") || "Music"}</div> : null}
                  {audioPreviewUrl ? <audio ref={previewAudioRef} src={audioPreviewUrl} autoPlay onLoadedMetadata={(event) => { const total = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 20; const clip = mediaType === "MUSIC" ? resolvedMusicDuration(musicDurationLimit, total) : Math.min(20, total); setAudioTrackDuration(total); setAudioClipDuration(clip); setAudioStartSeconds(0); event.currentTarget.currentTime = 0; }} onTimeUpdate={(event) => loopAudioClip(event.currentTarget, audioStartSeconds, audioClipDuration)} /> : null}
                </div>
                <small className="story-preview-hint">Your preview updates instantly</small>
              </div>

              <div ref={studioControlsRef} className="story-studio-controls">
                <section className="story-setting-card">
                  <div className="story-setting-heading"><strong>Media</strong><span>Everything in one place</span></div>
                  <button type="button" className="story-file-picker story-unified-media-picker" onClick={() => mediaInputRef.current?.click()}><span className="story-provided-icon story-provided-icon-media" aria-hidden="true" /><div><strong>{media || audio ? "Add or change media" : "Choose media"}</strong><small>{media?.name || audio?.name || "Photo, video, music — or photo + music"}</small></div><b>{media || audio ? "Add" : "Choose"}</b></button>
                  {media ? <div className="story-media-action-row"><button type="button" className="story-edit-media-button" onClick={() => setMediaEditorOpen(true)}><span className="story-provided-icon story-provided-icon-resize" aria-hidden="true" /><div><strong>Edit & resize</strong><small>Zoom, crop, rotate, mirror and reposition</small></div><b>Edit</b></button><button type="button" className="story-remove-visual-button story-remove-icon" onClick={removeVisualMedia} aria-label="Remove photo or video" title="Remove media"><FontAwesomeTrashCanIcon /></button></div> : null}
                  {media && !audio ? <button type="button" className="story-add-music-button" onClick={() => audioInputRef.current?.click()}><span>♫</span><div><strong>Add music</strong><small>Choose any 20-second part of a song</small></div><b>Add</b></button> : null}
                  {audio ? <div className="story-selected-audio"><span>♫</span><div><strong>{audio.name}</strong><small>Soundtrack selected</small></div><button type="button" className="story-remove-icon" onClick={removeAudio} aria-label="Remove music" title="Remove music"><FontAwesomeTrashCanIcon /></button></div> : null}
                  {audio && mediaType === "PHOTO_MUSIC" && audioTrackDuration > 0 ? <div className="story-audio-trimmer"><div><strong>Choose your 20 seconds</strong><span>{formatAudioTime(audioStartSeconds)} – {formatAudioTime(audioStartSeconds + audioClipDuration)} · {Math.round(audioClipDuration)} sec</span></div><input type="range" min={0} max={Math.max(0, audioTrackDuration - audioClipDuration)} step={.1} value={Math.min(audioStartSeconds, Math.max(0, audioTrackDuration - audioClipDuration))} onChange={(event) => { setAudioStartSeconds(Number(event.target.value)); window.requestAnimationFrame(syncPreviewAudio); }} aria-label="Music clip start time" /><small>{audioTrackDuration <= 20 ? "This song is shorter than 20 seconds, so the full song will play." : "Move the timeline to choose where your 20-second clip begins."}</small></div> : null}
                  <input ref={mediaInputRef} hidden multiple type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm" onChange={chooseMedia} />
                  <input ref={audioInputRef} hidden type="file" accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm" onChange={chooseAudio} />
                  {mediaType !== "MUSIC" ? <><label className="story-text-field story-caption-input"><span>Caption <small>{caption.length}/180</small></span><textarea value={caption} maxLength={180} onChange={(event) => setCaption(event.target.value)} placeholder="Say something simple…" /></label>
                  <div className="story-caption-editor" aria-label="Caption style editor">
                    <div className="story-caption-primary-row">
                      <label className="story-caption-font"><span>Font</span><AppleSelect ariaLabel="Caption font" value={captionStyle.font} onChange={(font) => setCaptionStyle({ ...captionStyle, font })} options={[{ value: "MODERN", label: "Modern · Minimal" }, { value: "POPPINS", label: "Poppins · Original" }, { value: "SOCIAL", label: "Social · Impact" }, { value: "ROUNDED", label: "Rounded · Friendly" }, { value: "ELEGANT", label: "Elegant · Editorial" }, { value: "LUXURY", label: "Luxury · Signature" }, { value: "CREATOR", label: "Creator · Bold" }, { value: "HANDWRITTEN", label: "Handwritten · Casual" }, { value: "PLAYFUL", label: "Playful · Fun" }, { value: "MONO", label: "Mono · Tech" }] as AppleSelectOption<StoryCaptionStyle["font"]>[]} /></label>
                      <div className="story-caption-size-stepper" aria-label="Caption size">
                        <span>Size</span>
                        <div><button type="button" onClick={() => setCaptionStyle({ ...captionStyle, fontSize: Math.max(8, captionStyle.fontSize - 1) })} aria-label="Make text smaller">−</button><input type="number" min={8} max={72} step={1} value={captionStyle.fontSize} onChange={(event) => setCaptionStyle({ ...captionStyle, fontSize: Math.min(72, Math.max(8, Number(event.target.value) || 8)) })} aria-label="Caption size in pixels" /><button type="button" onClick={() => setCaptionStyle({ ...captionStyle, fontSize: Math.min(72, captionStyle.fontSize + 1) })} aria-label="Make text larger">＋</button></div>
                      </div>
                    </div>
                    <div className="story-caption-toolbar story-caption-toolbar-smart">
                      <button type="button" className={captionStyle.bold ? "active" : ""} onClick={() => setCaptionStyle({ ...captionStyle, bold: !captionStyle.bold })} aria-label="Bold"><b>B</b></button>
                      <button type="button" className={captionStyle.italic ? "active" : ""} onClick={() => setCaptionStyle({ ...captionStyle, italic: !captionStyle.italic })} aria-label="Italic"><i>I</i></button>
                      {(["LEFT", "CENTER", "RIGHT"] as const).map((align) => <button type="button" key={align} className={captionStyle.align === align ? "active" : ""} onClick={() => setCaptionStyle({ ...captionStyle, align })} aria-label={`${align.toLowerCase()} align`}><span aria-hidden="true">{align === "LEFT" ? "≡" : align === "CENTER" ? "☰" : "≣"}</span></button>)}
                      <div className="story-caption-position-select" title="Position"><AppleSelect prefix="Place" ariaLabel="Caption position" value={captionStyle.position} onChange={(position) => setCaptionStyle({ ...captionStyle, position, offsetX: position === "CUSTOM" ? captionCoordinates(captionStyle).x : captionStyle.offsetX, offsetY: position === "CUSTOM" ? captionCoordinates(captionStyle).y : captionStyle.offsetY })} options={[{ value: "TOP", label: "Top" }, { value: "CENTER", label: "Center" }, { value: "BOTTOM", label: "Bottom" }, { value: "LEFT", label: "Left" }, { value: "RIGHT", label: "Right" }, { value: "CUSTOM", label: "Custom" }] as AppleSelectOption<StoryCaptionStyle["position"]>[]} /></div>
                    </div>
                    <div className="story-caption-rotation-compact">
                      <span>Rotate</span><div><button type="button" onClick={() => setCaptionStyle({ ...captionStyle, rotation: Math.max(-180, captionStyle.rotation - 15) })} aria-label="Rotate left">−</button><label><input type="number" min={-180} max={180} step={1} value={captionStyle.rotation} onChange={(event) => setCaptionStyle({ ...captionStyle, rotation: Math.min(180, Math.max(-180, Number(event.target.value) || 0)) })} aria-label="Caption rotation in degrees" /><i>°</i></label><button type="button" onClick={() => setCaptionStyle({ ...captionStyle, rotation: Math.min(180, captionStyle.rotation + 15) })} aria-label="Rotate right">＋</button></div>
                    </div>
                    <small className="story-caption-drag-hint">Drag the caption directly on the preview to place it anywhere.</small>
                    <div className="story-caption-look">
                      <div className="story-caption-style-row"><span>Text</span>{captionColors.map((color) => <button type="button" key={color} className={captionStyle.color === color ? "active" : ""} style={{ background: color }} onClick={() => setCaptionStyle({ ...captionStyle, color })} aria-label={`Text color ${color}`} />)}</div>
                      <div className="story-caption-backgrounds"><span>Backdrop</span>{(["NONE", "GLASS", "SOLID"] as const).map((background) => <button type="button" key={background} className={captionStyle.background === background ? "active" : ""} onClick={() => setCaptionStyle({ ...captionStyle, background })}>{background === "NONE" ? "None" : background.charAt(0) + background.slice(1).toLowerCase()}</button>)}</div>
                      {captionStyle.background === "SOLID" ? <div className="story-caption-style-row"><span>Fill</span>{captionBackgroundColors.map((backgroundColor) => <button type="button" key={backgroundColor} className={captionStyle.backgroundColor === backgroundColor ? "active" : ""} style={{ background: backgroundColor }} onClick={() => setCaptionStyle({ ...captionStyle, backgroundColor })} aria-label={`Background color ${backgroundColor}`} />)}</div> : null}
                    </div>
                  </div></> : null}
                  {(mediaType === "MUSIC" || mediaType === "PHOTO_MUSIC") ? <label className="story-text-field"><span>Music title</span><input value={musicTitle} maxLength={80} onChange={(event) => setMusicTitle(event.target.value)} placeholder="Optional display name" /></label> : null}
                </section>

                <section className="story-setting-card">
                  <div className="story-setting-heading"><strong>Make it yours</strong><span>Optional</span></div>
                  <div className="story-accent-row">{accents.map((value) => <button type="button" key={value} className={`story-accent-dot story-accent-${value}${accent === value ? " active" : ""}`} onClick={() => setAccent(value)} aria-label={value === "none" ? "No color, matched blur only" : `${value} color`}>{value === "none" ? "None" : null}</button>)}</div>
                  <div className="story-simple-grid">
                    <label><span>Who can see it?</span><AppleSelect ariaLabel="Story audience" value={audience} onChange={setAudience} options={[{ value: "PUBLIC", label: "Everyone" }, { value: "FOLLOWERS", label: "Followers" }, { value: "PRIVATE", label: "Only me" }] as AppleSelectOption<StoryAudience>[]} /></label>
                    <label><span>Keep it for</span><AppleSelect ariaLabel="Story lifetime" value={lifetimeHours} onChange={setLifetimeHours} options={[{ value: 6, label: "6 hours" }, { value: 12, label: "12 hours" }, { value: 24, label: "24 hours" }, { value: 48, label: "48 hours" }]} /></label>
                    {mediaType !== "MUSIC" ? <label><span>Photo pace</span><AppleSelect ariaLabel="Photo pace" value={durationSeconds} onChange={setDurationSeconds} options={[{ value: 5, label: "Quick · 5 sec" }, { value: 7, label: "Balanced · 7 sec" }, { value: 12, label: "Calm · 12 sec" }, { value: 20, label: "Reading · 20 sec" }]} /></label> : null}
                    {mediaType === "MUSIC" ? <label><span>Music duration</span><AppleSelect ariaLabel="Music duration" value={musicDurationLimit} onChange={(limit) => { setMusicDurationLimit(limit); if (audioTrackDuration > 0) { setAudioStartSeconds(0); setAudioClipDuration(resolvedMusicDuration(limit, audioTrackDuration)); window.requestAnimationFrame(() => { const player = previewAudioRef.current; if (player) { player.currentTime = 0; void player.play().catch(() => undefined); } }); } }} options={[{ value: "FULL", label: "None · Full music" }, { value: 10, label: "10 seconds" }, { value: 20, label: "20 seconds" }, { value: 30, label: "30 seconds" }, { value: 60, label: "1 minute" }] as AppleSelectOption<MusicDurationLimit>[]} /></label> : null}
                    <label className="story-switch-row"><span><strong>Friendly replies</strong><small>Let people respond</small></span><input type="checkbox" checked={allowReplies} onChange={(event) => setAllowReplies(event.target.checked)} /></label>
                  </div>
                </section>
                {error ? <div className="story-studio-error" role="alert">{error}</div> : null}
              </div>
            </div>
          </section>
          {mediaEditorOpen && previewUrl ? <StoryMediaEditor source={previewUrl} kind={mediaType === "VIDEO" ? "video" : "image"} value={mediaTransform} onChange={setMediaTransform} onClose={() => setMediaEditorOpen(false)} /> : null}
        </div>
      ) : null}

      {activeBundle && activeStory ? (
        <div className="story-viewer-backdrop" role="dialog" aria-modal="true" aria-label={`${activeBundle.author.name}'s story`}>
          <button className="story-viewer-close" type="button" onClick={onCloseViewer} aria-label="Close story">×</button>
          <button className="story-viewer-nav previous" type="button" onClick={() => moveViewer(-1)} aria-label="Previous story">‹</button>
          <article className={`story-viewer-card story-accent-${activeStory.accent}`}>
            <div className="story-progress-row">{activeBundle.stories.map((story, index) => <span key={story.id}><i className={index < storyIndex ? "done" : index === storyIndex ? "playing" : ""} key={index === storyIndex ? progressKey : index} style={index === storyIndex ? { animationDuration: `${story.durationSeconds}s` } : undefined} /></span>)}</div>
            <header className="story-viewer-header">
              <UserAvatar initials={activeBundle.author.initials} image={activeBundle.author.image} theme={activeBundle.author.avatarTheme} />
              <div className="story-viewer-author-copy"><strong>{activeBundle.author.name}</strong><small>{new Date(activeStory.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></div>
              <span className="story-viewer-actions">
                {activeBundle.author.isOwn ? <button type="button" onClick={() => { onCloseViewer(); onOpenComposer(); }} aria-label="Add another story" title="Add another story"><StoryViewerAddIcon /></button> : null}
                <button type="button" className={!viewerSoundAvailable ? "is-disabled" : ""} aria-disabled={!viewerSoundAvailable} onClick={() => { if (viewerSoundAvailable) setIsMuted((value) => !value); }} aria-label={viewerSoundAvailable ? (isMuted ? "Unmute story" : "Mute story") : "Story has no sound"} title={viewerSoundAvailable ? (isMuted ? "Unmute" : "Mute") : "No sound available"}><StoryViewerSoundIcon muted={!viewerSoundAvailable || isMuted} /></button>
                {activeBundle.author.isOwn ? <button type="button" className="danger" disabled={isDeleting} onClick={deleteStory} aria-label="Delete story" title="Delete story">{isDeleting ? <span className="story-viewer-action-loader">…</span> : <FontAwesomeTrashCanIcon />}</button> : null}
              </span>
            </header>
            <div className="story-viewer-media">
              {activeStory.mediaUrl && activeStory.mediaType !== "MUSIC" && activeStory.accent === "none" ? <div className="story-color-backdrop" style={paletteBackground(activeStory.backgroundColors || DEFAULT_STORY_PALETTE)} aria-hidden="true" /> : null}
              {activeStory.mediaUrl && activeStory.mediaType !== "MUSIC" ? <div className={`story-viewer-media-frame ${storyFrameClass(activeStory.mediaTransform?.frame || "PORTRAIT")}`}>{activeStory.mediaType === "VIDEO" ? <video src={activeStory.mediaUrl} style={storyMediaStyle(activeStory.mediaTransform || DEFAULT_STORY_MEDIA_TRANSFORM)} autoPlay muted={isMuted} playsInline onEnded={() => moveViewer(1)} /> : <img src={activeStory.mediaUrl} style={storyMediaStyle(activeStory.mediaTransform || DEFAULT_STORY_MEDIA_TRANSFORM)} alt="Story" />}</div> : null}
              {activeStory.mediaType === "MUSIC" ? <MusicVisualizer viewer title={activeStory.musicTitle || "A sound from Gupto"} /> : null}
              {activeStory.caption ? <p className={captionClassName(activeStory.captionStyle || DEFAULT_STORY_CAPTION_STYLE, activeStory.caption)} style={captionInlineStyle(activeStory.captionStyle || DEFAULT_STORY_CAPTION_STYLE)}>{activeStory.caption}</p> : null}
              {activeStory.audioUrl ? <audio ref={viewerAudioRef} src={activeStory.audioUrl} autoPlay muted={isMuted} onLoadedMetadata={(event) => { event.currentTarget.currentTime = activeStory.audioStartSeconds || 0; }} onTimeUpdate={(event) => loopAudioClip(event.currentTarget, activeStory.audioStartSeconds || 0, activeStory.audioDurationSeconds || 20)} /> : null}
            </div>
            <footer className="story-viewer-footer">{activeStory.musicTitle ? <span>♫ {activeStory.musicTitle}</span> : <span>{activeStory.audience === "PUBLIC" ? "Everyone" : activeStory.audience === "FOLLOWERS" ? "Followers" : "Only you"}</span>} {activeBundle.author.isOwn ? <small>{activeStory.viewCount} views</small> : <small>{activeStory.allowReplies ? "Replies allowed" : "Replies are off"}</small>}</footer>
          </article>
          <button className="story-viewer-nav next" type="button" onClick={() => moveViewer(1)} aria-label="Next story">›</button>
        </div>
      ) : null}
    </>
  );
}
