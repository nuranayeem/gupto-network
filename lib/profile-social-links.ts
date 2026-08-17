const PLATFORM_NAMES: Array<{ match: (host: string) => boolean; label: string }> = [
  { match: (host) => host === "facebook.com" || host.endsWith(".facebook.com"), label: "Facebook" },
  { match: (host) => host === "instagram.com" || host.endsWith(".instagram.com"), label: "Instagram" },
  { match: (host) => host === "x.com" || host.endsWith(".x.com") || host === "twitter.com" || host.endsWith(".twitter.com"), label: "X" },
  { match: (host) => host === "linkedin.com" || host.endsWith(".linkedin.com"), label: "LinkedIn" },
  { match: (host) => host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be", label: "YouTube" },
  { match: (host) => host === "tiktok.com" || host.endsWith(".tiktok.com"), label: "TikTok" },
  { match: (host) => host === "github.com" || host.endsWith(".github.com"), label: "GitHub" },
  { match: (host) => host === "threads.net" || host.endsWith(".threads.net"), label: "Threads" },
  { match: (host) => host === "pinterest.com" || host.endsWith(".pinterest.com"), label: "Pinterest" },
  { match: (host) => host === "snapchat.com" || host.endsWith(".snapchat.com"), label: "Snapchat" },
  { match: (host) => host === "reddit.com" || host.endsWith(".reddit.com"), label: "Reddit" },
  { match: (host) => host === "t.me" || host === "telegram.me", label: "Telegram" },
  { match: (host) => host === "wa.me" || host === "whatsapp.com" || host.endsWith(".whatsapp.com"), label: "WhatsApp" },
  { match: (host) => host === "discord.com" || host === "discord.gg" || host.endsWith(".discord.com"), label: "Discord" },
  { match: (host) => host === "twitch.tv" || host.endsWith(".twitch.tv"), label: "Twitch" },
  { match: (host) => host === "medium.com" || host.endsWith(".medium.com"), label: "Medium" },
  { match: (host) => host === "behance.net" || host.endsWith(".behance.net"), label: "Behance" },
  { match: (host) => host === "dribbble.com" || host.endsWith(".dribbble.com"), label: "Dribbble" },
  { match: (host) => host === "spotify.com" || host.endsWith(".spotify.com"), label: "Spotify" },
  { match: (host) => host === "soundcloud.com" || host.endsWith(".soundcloud.com"), label: "SoundCloud" },
];

export function normalizeSocialLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (!/^https?:$/.test(url.protocol) || !url.hostname || !url.hostname.includes(".")) return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeSocialLinks(values: string[]) {
  const normalized: string[] = [];

  for (const value of values) {
    if (!value.trim()) continue;
    const next = normalizeSocialLink(value);
    if (next === null) return null;
    if (next && !normalized.includes(next)) normalized.push(next);
  }

  return normalized;
}

export function getSocialLinkHostname(value: string) {
  const normalized = normalizeSocialLink(value);
  if (!normalized) return "";

  try {
    return new URL(normalized).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function getSocialLinkLabel(value: string) {
  const host = getSocialLinkHostname(value);
  if (!host) return "Social link";
  return PLATFORM_NAMES.find((platform) => platform.match(host))?.label || host;
}
