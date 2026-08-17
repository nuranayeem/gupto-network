import { normalizeSocialLink } from "@/lib/profile-social-links";

export type ProfileWorkplace = {
  name: string;
  url: string;
};

const MAX_WORKPLACES = 20;
const MAX_WORKPLACE_NAME = 120;
const MAX_WORKPLACE_URL = 500;

export function normalizeProfileWorkplaces(value: unknown): ProfileWorkplace[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length > MAX_WORKPLACES) return null;

  const normalized: ProfileWorkplace[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (!item || typeof item !== "object") return null;

    const record = item as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const rawUrl = typeof record.url === "string" ? record.url.trim() : "";

    if (name.length > MAX_WORKPLACE_NAME || rawUrl.length > MAX_WORKPLACE_URL) return null;
    if (!name && !rawUrl) continue;

    let url = "";
    if (rawUrl) {
      const nextUrl = normalizeSocialLink(rawUrl);
      if (nextUrl === null) return null;
      url = nextUrl;
    }

    const key = `${name.toLowerCase()}|${url.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ name, url });
  }

  return normalized;
}

export function parseProfileWorkplaces(value: unknown): ProfileWorkplace[] {
  return normalizeProfileWorkplaces(value) ?? [];
}
