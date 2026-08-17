import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEDIA_ROOT = path.join(process.cwd(), "public", "uploads", "profile-media");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jpe": "image/jpeg",
  ".jfif": "image/jpeg",
  ".pjpeg": "image/jpeg",
  ".pjp": "image/jpeg",
  ".png": "image/png",
  ".apng": "image/apng",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".dib": "image/bmp",
  ".ico": "image/x-icon",
  ".cur": "image/x-icon",
  ".svg": "image/svg+xml",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".jp2": "image/jp2",
  ".j2k": "image/jp2",
  ".jpf": "image/jpx",
  ".jpx": "image/jpx",
  ".jxl": "image/jxl",
};

function safeSegment(value: string) {
  return /^[A-Za-z0-9_-]{1,160}$/.test(value);
}

function safeFilename(value: string) {
  return /^[A-Za-z0-9._-]{1,240}$/.test(value) && value !== "." && value !== "..";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string; filename: string }> },
) {
  const { userId, filename } = await params;

  if (!safeSegment(userId) || !safeFilename(filename)) {
    return new Response("Not found", { status: 404 });
  }

  const directory = path.resolve(MEDIA_ROOT, userId);
  const filePath = path.resolve(directory, filename);

  if (!filePath.startsWith(`${directory}${path.sep}`)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const buffer = await fs.readFile(filePath);
    const extension = path.extname(filename).toLowerCase();
    const contentType = CONTENT_TYPES[extension] || "application/octet-stream";

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Length": String(buffer.byteLength),
      "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=31536000, immutable",
    });

    // Keep original SVG bytes but prevent active same-origin execution when
    // someone opens an uploaded SVG directly in a browser tab.
    if (contentType === "image/svg+xml") {
      headers.set("Content-Security-Policy", "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:");
    }

    return new Response(new Uint8Array(buffer), { status: 200, headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
