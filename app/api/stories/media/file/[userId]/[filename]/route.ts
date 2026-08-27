import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEDIA_ROOT = path.join(process.cwd(), "public", "uploads", "story-media");
const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif",
  ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
  ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".wav": "audio/wav", ".ogg": "audio/ogg",
};

function valid(value: string) {
  return /^[A-Za-z0-9._-]{1,240}$/.test(value) && value !== "." && value !== "..";
}

export async function GET(request: Request, { params }: { params: Promise<{ userId: string; filename: string }> }) {
  const { userId, filename } = await params;
  if (!valid(userId) || !valid(filename)) return new Response("Not found", { status: 404 });

  const directory = path.resolve(MEDIA_ROOT, userId);
  const filePath = path.resolve(directory, filename);
  if (!filePath.startsWith(`${directory}${path.sep}`)) return new Response("Not found", { status: 404 });

  try {
    const stat = await fs.stat(filePath);
    const contentType = CONTENT_TYPES[path.extname(filename).toLowerCase()] || "application/octet-stream";
    const range = request.headers.get("range");

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) return new Response(null, { status: 416 });
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
      if (start > end || start >= stat.size) return new Response(null, { status: 416 });
      const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream;
      return new Response(stream, {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, max-age=31536000, immutable",
        },
      });
    }

    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stat.size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
