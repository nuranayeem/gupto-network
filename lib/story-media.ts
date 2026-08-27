import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type StoryUploadKind = "image" | "video" | "audio";

const MEDIA_ROOT = path.join(process.cwd(), "public", "uploads", "story-media");
const MAX_BYTES: Record<StoryUploadKind, number> = {
  image: 25 * 1024 * 1024,
  video: 150 * 1024 * 1024,
  audio: 40 * 1024 * 1024,
};

const ALLOWED: Record<StoryUploadKind, Record<string, string>> = {
  image: {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
  },
  video: {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
  },
  audio: {
    "audio/mpeg": ".mp3",
    "audio/mp4": ".m4a",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/ogg": ".ogg",
    "audio/webm": ".webm",
  },
};

export class StoryMediaError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "StoryMediaError";
    this.status = status;
  }
}

export async function writeStoryMedia(userId: string, file: File, kind: StoryUploadKind) {
  if (!file.size) throw new StoryMediaError(`Choose ${kind === "image" ? "a photo" : kind === "video" ? "a video" : "music"} first.`);
  if (file.size > MAX_BYTES[kind]) {
    const limit = Math.round(MAX_BYTES[kind] / 1024 / 1024);
    throw new StoryMediaError(`That ${kind} is too large. Choose one under ${limit} MB.`, 413);
  }

  const extension = ALLOWED[kind][file.type.toLowerCase()];
  if (!extension) throw new StoryMediaError(`This ${kind} format is not supported.`);

  const directory = path.join(MEDIA_ROOT, userId);
  await fs.mkdir(directory, { recursive: true });
  const filename = `${kind}-${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
  const filePath = path.join(directory, filename);
  await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return {
    filePath,
    url: `/uploads/story-media/${userId}/${filename}`,
  };
}

export async function removeStoryMediaFile(filePath: string | null | undefined) {
  if (!filePath) return;
  await fs.unlink(filePath).catch(() => undefined);
}

export async function removeStoryMediaUrl(userId: string, url: string | null | undefined) {
  if (!url) return;
  const cleanUrl = url.split("?")[0];
  const prefix = `/uploads/story-media/${userId}/`;
  if (!cleanUrl.startsWith(prefix)) return;

  const directory = path.resolve(MEDIA_ROOT, userId);
  const candidate = path.resolve(directory, path.basename(cleanUrl));
  if (!candidate.startsWith(`${directory}${path.sep}`)) return;
  await fs.unlink(candidate).catch(() => undefined);
}
