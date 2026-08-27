import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { removeStoryMediaFile, StoryMediaError, writeStoryMedia } from "@/lib/story-media";

export const runtime = "nodejs";

const mediaTypes = new Set(["PHOTO", "VIDEO", "MUSIC", "PHOTO_MUSIC"]);
const audiences = new Set(["PUBLIC", "FOLLOWERS", "PRIVATE"]);
const accents = new Set(["none", "violet", "mint", "sunset", "blue", "rose", "aqua", "amber", "coral"]);

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
}

async function signedInUser() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return null;
  return prisma.user.findUnique({ where: { email }, select: { id: true } });
}

export async function GET() {
  const viewer = await signedInUser();
  if (!viewer) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const followed = await prisma.follow.findMany({
    where: { followerId: viewer.id },
    select: { followingId: true },
  });
  const followedIds = followed.map((item) => item.followingId);
  const now = new Date();

  const activeStories = await prisma.story.findMany({
    where: {
      expiresAt: { gt: now },
      OR: [
        { authorId: viewer.id },
        { audience: "PUBLIC" },
        { audience: "FOLLOWERS", authorId: { in: followedIds } },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      mediaType: true,
      mediaUrl: true,
      audioUrl: true,
      audioStartSeconds: true,
      audioDurationSeconds: true,
      backgroundColorA: true,
      backgroundColorB: true,
      backgroundColorC: true,
      mediaScale: true,
      mediaRotation: true,
      mediaFlipX: true,
      mediaFlipY: true,
      mediaOffsetX: true,
      mediaOffsetY: true,
      mediaFit: true,
      mediaFrame: true,
      caption: true,
      captionFont: true,
      captionSize: true,
      captionFontSize: true,
      captionAlign: true,
      captionBold: true,
      captionItalic: true,
      captionColor: true,
      captionBg: true,
      captionBgColor: true,
      captionPosition: true,
      captionOffsetX: true,
      captionOffsetY: true,
      captionRotation: true,
      musicTitle: true,
      accent: true,
      audience: true,
      durationSeconds: true,
      allowReplies: true,
      createdAt: true,
      expiresAt: true,
      author: { select: { id: true, name: true, username: true, email: true, image: true, avatarTheme: true } },
      views: { where: { viewerId: viewer.id }, select: { id: true }, take: 1 },
      _count: { select: { views: true } },
    },
  });

  const grouped = new Map<string, typeof activeStories>();
  for (const story of activeStories) {
    const current = grouped.get(story.author.id) || [];
    current.push(story);
    grouped.set(story.author.id, current);
  }

  const bundles = [...grouped.values()].map((items) => {
    const author = items[0].author;
    const name = author.name || author.username || author.email.split("@")[0] || "User";
    const username = author.username || author.email.split("@")[0] || "user";
    const latest = items[items.length - 1];
    return {
      author: {
        id: author.id,
        name,
        username,
        initials: initials(name),
        image: author.image,
        avatarTheme: author.avatarTheme,
        isOwn: author.id === viewer.id,
      },
      stories: items.map((story) => ({
        id: story.id,
        mediaType: story.mediaType,
        mediaUrl: story.mediaUrl,
        audioUrl: story.audioUrl,
        audioStartSeconds: story.audioStartSeconds,
        audioDurationSeconds: story.audioDurationSeconds,
        backgroundColors: [story.backgroundColorA, story.backgroundColorB, story.backgroundColorC],
        mediaTransform: {
          scale: story.mediaScale,
          rotation: story.mediaRotation,
          flipX: story.mediaFlipX,
          flipY: story.mediaFlipY,
          offsetX: story.mediaOffsetX,
          offsetY: story.mediaOffsetY,
          fit: story.mediaFit === "CONTAIN" ? "CONTAIN" : "COVER",
          frame: story.mediaFrame === "SQUARE" || story.mediaFrame === "LANDSCAPE" ? story.mediaFrame : "PORTRAIT",
        },
        caption: story.caption || "",
        captionStyle: {
          font: ["MODERN", "CLASSIC", "POPPINS", "SOCIAL", "ROUNDED", "ELEGANT", "LUXURY", "CREATOR", "HANDWRITTEN", "PLAYFUL", "MONO"].includes(story.captionFont) ? story.captionFont : "MODERN",
          size: ["SMALL", "MEDIUM", "LARGE"].includes(story.captionSize) ? story.captionSize : "MEDIUM",
          fontSize: Math.min(72, Math.max(8, story.captionFontSize || 17)),
          align: ["LEFT", "CENTER", "RIGHT"].includes(story.captionAlign) ? story.captionAlign : "CENTER",
          bold: story.captionBold,
          italic: story.captionItalic,
          color: story.captionColor,
          background: ["NONE", "GLASS", "SOLID"].includes(story.captionBg) ? story.captionBg : "NONE",
          backgroundColor: story.captionBgColor,
          position: ["TOP", "BOTTOM", "LEFT", "CENTER", "RIGHT", "CUSTOM"].includes(story.captionPosition) ? story.captionPosition : "BOTTOM",
          offsetX: story.captionOffsetX,
          offsetY: story.captionOffsetY,
          rotation: story.captionRotation,
        },
        musicTitle: story.musicTitle || "",
        accent: story.accent,
        audience: story.audience,
        durationSeconds: story.durationSeconds,
        allowReplies: story.allowReplies,
        createdAt: story.createdAt.toISOString(),
        expiresAt: story.expiresAt.toISOString(),
        viewed: story.views.length > 0,
        viewCount: story._count.views,
      })),
      hasUnseen: items.some((story) => story.views.length === 0),
      latestPreview: latest.mediaType === "PHOTO" || latest.mediaType === "PHOTO_MUSIC" ? latest.mediaUrl : null,
      latestAccent: latest.accent,
    };
  }).sort((a, b) => Number(b.author.isOwn) - Number(a.author.isOwn) || Number(b.hasUnseen) - Number(a.hasUnseen));

  return NextResponse.json({ bundles });
}

export async function POST(request: Request) {
  const viewer = await signedInUser();
  if (!viewer) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const data = await request.formData().catch(() => null);
  if (!data) return NextResponse.json({ error: "Could not read your story." }, { status: 400 });

  const mediaType = String(data.get("mediaType") || "").toUpperCase();
  const audience = String(data.get("audience") || "PUBLIC").toUpperCase();
  const accentValue = String(data.get("accent") || "violet").toLowerCase();
  const accent = accents.has(accentValue) ? accentValue : "violet";
  const caption = String(data.get("caption") || "").trim().slice(0, 180);
  const captionFont = ["MODERN", "CLASSIC", "POPPINS", "SOCIAL", "ROUNDED", "ELEGANT", "LUXURY", "CREATOR", "HANDWRITTEN", "PLAYFUL", "MONO"].includes(String(data.get("captionFont"))) ? String(data.get("captionFont")) : "MODERN";
  const captionSize = ["SMALL", "MEDIUM", "LARGE"].includes(String(data.get("captionSize"))) ? String(data.get("captionSize")) : "MEDIUM";
  const rawCaptionFontSize = Number(data.get("captionFontSize"));
  const captionFontSize = Number.isFinite(rawCaptionFontSize) ? Math.min(72, Math.max(8, Math.round(rawCaptionFontSize))) : 17;
  const captionAlign = ["LEFT", "CENTER", "RIGHT"].includes(String(data.get("captionAlign"))) ? String(data.get("captionAlign")) : "CENTER";
  const captionBold = data.get("captionBold") !== "false";
  const captionItalic = data.get("captionItalic") === "true";
  const safeColor = (value: FormDataEntryValue | null, fallback: string) => /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : fallback;
  const captionColor = safeColor(data.get("captionColor"), "#ffffff");
  const captionBg = ["NONE", "GLASS", "SOLID"].includes(String(data.get("captionBg"))) ? String(data.get("captionBg")) : "NONE";
  const captionBgColor = safeColor(data.get("captionBgColor"), "#171922");
  const captionPosition = ["TOP", "BOTTOM", "LEFT", "CENTER", "RIGHT", "CUSTOM"].includes(String(data.get("captionPosition"))) ? String(data.get("captionPosition")) : "BOTTOM";
  const captionOffsetX = Math.min(92, Math.max(8, Number(data.get("captionOffsetX")) || 50));
  const captionOffsetY = Math.min(92, Math.max(8, Number(data.get("captionOffsetY")) || 82));
  const captionRotation = Math.min(180, Math.max(-180, Math.round(Number(data.get("captionRotation")) || 0)));
  const backgroundColorA = safeColor(data.get("backgroundColorA"), "#4b3d36");
  const backgroundColorB = safeColor(data.get("backgroundColorB"), "#766052");
  const backgroundColorC = safeColor(data.get("backgroundColorC"), "#b3927c");
  const musicTitle = String(data.get("musicTitle") || "").trim().slice(0, 80);
  const audioStartSeconds = Math.max(0, Number(data.get("audioStartSeconds")) || 0);
  const rawAudioDuration = Math.max(.1, Number(data.get("audioDurationSeconds")) || 20);
  const audioDurationSeconds = mediaType === "MUSIC" ? rawAudioDuration : Math.min(20, rawAudioDuration);
  const durationSeconds = mediaType === "MUSIC" ? Math.max(1, Math.ceil(audioDurationSeconds)) : Math.min(20, Math.max(4, Math.round(Number(data.get("durationSeconds")) || 7)));
  const lifetimeHours = [6, 12, 24, 48].includes(Number(data.get("lifetimeHours"))) ? Number(data.get("lifetimeHours")) : 24;
  const allowReplies = data.get("allowReplies") !== "false";
  const mediaValue = data.get("media");
  const audioValue = data.get("audio");
  const media = mediaValue instanceof File && mediaValue.size ? mediaValue : null;
  const audio = audioValue instanceof File && audioValue.size ? audioValue : null;
  const mediaScale = Math.min(3, Math.max(.5, Number(data.get("mediaScale")) || 1));
  const mediaRotation = Math.min(180, Math.max(-180, Math.round(Number(data.get("mediaRotation")) || 0)));
  const mediaFlipX = data.get("mediaFlipX") === "true";
  const mediaFlipY = data.get("mediaFlipY") === "true";
  const mediaOffsetX = Math.min(60, Math.max(-60, Number(data.get("mediaOffsetX")) || 0));
  const mediaOffsetY = Math.min(60, Math.max(-60, Number(data.get("mediaOffsetY")) || 0));
  const mediaFit = data.get("mediaFit") === "COVER" ? "COVER" : "CONTAIN";
  const frameValue = String(data.get("mediaFrame") || "PORTRAIT");
  const mediaFrame = frameValue === "SQUARE" || frameValue === "LANDSCAPE" ? frameValue : "PORTRAIT";

  if (!mediaTypes.has(mediaType) || !audiences.has(audience)) {
    return NextResponse.json({ error: "Choose a valid story type and audience." }, { status: 400 });
  }
  if ((mediaType === "PHOTO" || mediaType === "VIDEO" || mediaType === "PHOTO_MUSIC") && !media) {
    return NextResponse.json({ error: mediaType === "VIDEO" ? "Choose a video." : "Choose a photo." }, { status: 400 });
  }
  if ((mediaType === "MUSIC" || mediaType === "PHOTO_MUSIC") && !audio) {
    return NextResponse.json({ error: "Choose music for this story." }, { status: 400 });
  }

  let mediaPath: string | null = null;
  let audioPath: string | null = null;

  try {
    const writtenMedia = media
      ? await writeStoryMedia(viewer.id, media, mediaType === "VIDEO" ? "video" : "image")
      : null;
    mediaPath = writtenMedia?.filePath || null;
    const writtenAudio = audio ? await writeStoryMedia(viewer.id, audio, "audio") : null;
    audioPath = writtenAudio?.filePath || null;

    const story = await prisma.story.create({
      data: {
        authorId: viewer.id,
        mediaType: mediaType as "PHOTO" | "VIDEO" | "MUSIC" | "PHOTO_MUSIC",
        mediaUrl: writtenMedia?.url || null,
        audioUrl: writtenAudio?.url || null,
        audioStartSeconds,
        audioDurationSeconds,
        backgroundColorA,
        backgroundColorB,
        backgroundColorC,
        mediaScale,
        mediaRotation,
        mediaFlipX,
        mediaFlipY,
        mediaOffsetX,
        mediaOffsetY,
        mediaFit,
        mediaFrame,
        caption: caption || null,
        captionFont,
        captionSize,
        captionFontSize,
        captionAlign,
        captionBold,
        captionItalic,
        captionColor,
        captionBg,
        captionBgColor,
        captionPosition,
        captionOffsetX,
        captionOffsetY,
        captionRotation,
        musicTitle: musicTitle || (audio?.name ? audio.name.replace(/\.[^.]+$/, "").slice(0, 80) : null),
        accent,
        audience: audience as "PUBLIC" | "FOLLOWERS" | "PRIVATE",
        durationSeconds,
        allowReplies,
        expiresAt: new Date(Date.now() + lifetimeHours * 60 * 60 * 1000),
      },
      select: { id: true },
    });

    return NextResponse.json({ storyId: story.id }, { status: 201 });
  } catch (error) {
    await Promise.all([removeStoryMediaFile(mediaPath), removeStoryMediaFile(audioPath)]);
    if (error instanceof StoryMediaError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Story creation failed", error);
    return NextResponse.json({ error: "Could not publish your story. Please try again." }, { status: 500 });
  }
}
