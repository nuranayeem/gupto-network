"use client";

import { useEffect, useState, type CSSProperties } from "react";

type Props = {
  source: string;
  kind: "image" | "video";
};

type PaletteStyle = CSSProperties & {
  "--story-palette-one": string;
  "--story-palette-two": string;
  "--story-palette-three": string;
};

const FALLBACK_PALETTE = ["rgb(54 41 91)", "rgb(31 69 83)", "rgb(25 27 42)"] as const;

function colorDistance(a: number[], b: number[]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function dominantPalette(media: CanvasImageSource) {
  const canvas = document.createElement("canvas");
  canvas.width = 28;
  canvas.height = 28;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return [...FALLBACK_PALETTE];

  context.drawImage(media, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 180) continue;
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const bucket = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };
    bucket.count += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  const candidates = [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .map((bucket) => [bucket.r / bucket.count, bucket.g / bucket.count, bucket.b / bucket.count]);
  const selected: number[][] = [];

  for (const color of candidates) {
    if (selected.every((existing) => colorDistance(existing, color) > 52)) selected.push(color);
    if (selected.length === 3) break;
  }
  while (selected.length < 3) {
    const base = selected[0] || [54, 41, 91];
    const offset = selected.length === 1 ? 28 : -24;
    selected.push(base.map((channel) => Math.max(12, Math.min(224, channel + offset))));
  }

  return selected.map(([r, g, b]) => `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`);
}

export default function StoryPaletteBackdrop({ source, kind }: Props) {
  const [palette, setPalette] = useState<string[]>([...FALLBACK_PALETTE]);

  useEffect(() => {
    let cancelled = false;
    const applyPalette = (media: CanvasImageSource) => {
      try {
        const next = dominantPalette(media);
        if (!cancelled) setPalette(next);
      } catch {
        if (!cancelled) setPalette([...FALLBACK_PALETTE]);
      }
    };

    if (kind === "video") {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.onloadeddata = () => applyPalette(video);
      video.src = source;
      video.load();
      return () => { cancelled = true; video.removeAttribute("src"); video.load(); };
    }

    const image = new Image();
    image.onload = () => applyPalette(image);
    image.src = source;
    return () => { cancelled = true; image.onload = null; };
  }, [kind, source]);

  const style: PaletteStyle = {
    "--story-palette-one": palette[0],
    "--story-palette-two": palette[1],
    "--story-palette-three": palette[2],
  };

  return <div className="story-palette-backdrop" style={style} aria-hidden="true" />;
}
