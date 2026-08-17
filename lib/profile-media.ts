import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type ProfileMediaKind = "profile" | "cover";

export type PreparedProfileMedia = {
  buffer: Buffer;
  extension: string;
};

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const MEDIA_ROOT = path.join(process.cwd(), "public", "uploads", "profile-media");


export class ProfileMediaError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ProfileMediaError";
    this.status = status;
  }
}

function extensionOf(name: string) {
  return path.extname(name || "").toLowerCase();
}

function safeExtension(value: string) {
  const extension = value.toLowerCase();
  return /^\.[a-z0-9]{1,8}$/.test(extension) ? extension : ".img";
}

function extensionFromMime(type: string) {
  const mime = type.toLowerCase();
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  if (mime === "image/avif") return ".avif";
  if (mime === "image/bmp" || mime === "image/x-ms-bmp") return ".bmp";
  if (mime === "image/x-icon" || mime === "image/vnd.microsoft.icon") return ".ico";
  if (mime === "image/svg+xml") return ".svg";
  if (mime === "image/tiff") return ".tiff";
  if (mime === "image/heic") return ".heic";
  if (mime === "image/heif") return ".heif";
  return "";
}

export async function optimizeProfileMedia(
  file: File,
  _kind: ProfileMediaKind,
): Promise<PreparedProfileMedia> {
  if (!file.size) {
    throw new ProfileMediaError("Choose a photo first.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ProfileMediaError("That file is too large. Choose one under 100 MB.", 413);
  }

  const nameExtension = extensionOf(file.name);
  const mimeExtension = extensionFromMime(file.type);
  // Simple passthrough: Gupto stores the exact bytes the user uploaded.
  // No resize, crop, compression, sharpening, upscaling or format conversion.
  return {
    buffer: Buffer.from(await file.arrayBuffer()),
    extension: safeExtension(nameExtension || mimeExtension || ".img"),
  };
}

export async function writeProfileMedia(
  userId: string,
  kind: ProfileMediaKind,
  media: PreparedProfileMedia,
) {
  const directory = path.join(MEDIA_ROOT, userId);
  await fs.mkdir(directory, { recursive: true });

  const extension = safeExtension(media.extension);
  const filename = `${kind}-${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
  const filePath = path.join(directory, filename);
  await fs.writeFile(filePath, media.buffer);

  return {
    filePath,
    // Keep the clean public-looking URL. next.config rewrites this URL to
    // the Route Handler that reads runtime files from disk.
    url: `/uploads/profile-media/${userId}/${filename}`,
  };
}

export async function removeWrittenFile(filePath: string | null | undefined) {
  if (!filePath) return;
  await fs.unlink(filePath).catch(() => undefined);
}

export async function removeOldProfileMedia(userId: string, url: string | null | undefined) {
  if (!url) return;

  const cleanUrl = url.split("?")[0];
  const expectedPrefix = `/uploads/profile-media/${userId}/`;
  if (!cleanUrl.startsWith(expectedPrefix)) return;

  const basename = path.basename(cleanUrl);
  const directory = path.join(MEDIA_ROOT, userId);
  const candidate = path.resolve(directory, basename);
  const resolvedDirectory = `${path.resolve(directory)}${path.sep}`;

  if (!candidate.startsWith(resolvedDirectory)) return;
  await fs.unlink(candidate).catch(() => undefined);
}
