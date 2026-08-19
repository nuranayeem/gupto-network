import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  optimizeProfileMedia,
  ProfileMediaError,
  removeOldProfileMedia,
  removeWrittenFile,
  writeProfileMedia,
} from "@/lib/profile-media";

export const runtime = "nodejs";

const COVER_POSITION_MIN = -50;
const COVER_POSITION_MAX = 50;
const COVER_ZOOM_MIN = 1;
const COVER_ZOOM_MAX = 3;

type CoverAdjustment = {
  x: number;
  y: number;
  zoom: number;
};

function readCoverAdjustment(formData: FormData): CoverAdjustment | null | undefined {
  const keys = ["coverPositionX", "coverPositionY", "coverZoom"] as const;
  const hasAny = keys.some((key) => formData.has(key));
  if (!hasAny) return null;
  if (!keys.every((key) => formData.has(key))) return undefined;

  const x = Number(formData.get("coverPositionX"));
  const y = Number(formData.get("coverPositionY"));
  const zoom = Number(formData.get("coverZoom"));

  if (![x, y, zoom].every(Number.isFinite)) return undefined;
  if (x < COVER_POSITION_MIN || x > COVER_POSITION_MAX) return undefined;
  if (y < COVER_POSITION_MIN || y > COVER_POSITION_MAX) return undefined;
  if (zoom < COVER_ZOOM_MIN || zoom > COVER_ZOOM_MAX) return undefined;

  return { x, y, zoom };
}

export async function POST(request: Request) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      image: true,
      coverImage: true,
      coverPositionX: true,
      coverPositionY: true,
      coverZoom: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User account not found." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Could not read the uploaded file." }, { status: 400 });
  }

  const profileValue = formData.get("profile");
  const coverValue = formData.get("cover");
  const removeProfile = formData.get("removeProfile") === "1";
  const removeCover = formData.get("removeCover") === "1";
  const coverAdjustment = readCoverAdjustment(formData);

  if (coverAdjustment === undefined) {
    return NextResponse.json({ error: "Could not save the cover photo position." }, { status: 400 });
  }

  const profileFile = profileValue instanceof File && profileValue.size > 0 ? profileValue : null;
  const coverFile = coverValue instanceof File && coverValue.size > 0 ? coverValue : null;
  const hasCoverAdjustment = coverAdjustment !== null;

  if (!profileFile && !coverFile && !removeProfile && !removeCover && !hasCoverAdjustment) {
    return NextResponse.json({ error: "Choose a profile or cover photo first." }, { status: 400 });
  }

  let nextImage = user.image;
  let nextCoverImage = user.coverImage;
  let nextCoverPositionX = user.coverPositionX;
  let nextCoverPositionY = user.coverPositionY;
  let nextCoverZoom = user.coverZoom;
  let newProfilePath: string | null = null;
  let newCoverPath: string | null = null;

  try {
    if (profileFile) {
      const prepared = await optimizeProfileMedia(profileFile, "profile");
      const written = await writeProfileMedia(user.id, "profile", prepared);
      nextImage = written.url;
      newProfilePath = written.filePath;
    } else if (removeProfile) {
      nextImage = null;
    }

    if (coverFile) {
      const prepared = await optimizeProfileMedia(coverFile, "cover");
      const written = await writeProfileMedia(user.id, "cover", prepared);
      nextCoverImage = written.url;
      newCoverPath = written.filePath;

      if (!hasCoverAdjustment) {
        nextCoverPositionX = 0;
        nextCoverPositionY = 0;
        nextCoverZoom = 1;
      }
    } else if (removeCover) {
      nextCoverImage = null;
      nextCoverPositionX = 0;
      nextCoverPositionY = 0;
      nextCoverZoom = 1;
    }

    if (coverAdjustment && !removeCover) {
      nextCoverPositionX = coverAdjustment.x;
      nextCoverPositionY = coverAdjustment.y;
      nextCoverZoom = coverAdjustment.zoom;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        image: nextImage,
        coverImage: nextCoverImage,
        coverPositionX: nextCoverPositionX,
        coverPositionY: nextCoverPositionY,
        coverZoom: nextCoverZoom,
      },
      select: {
        image: true,
        coverImage: true,
        coverPositionX: true,
        coverPositionY: true,
        coverZoom: true,
      },
    });

    if (user.image && user.image !== updated.image) {
      await removeOldProfileMedia(user.id, user.image);
    }
    if (user.coverImage && user.coverImage !== updated.coverImage) {
      await removeOldProfileMedia(user.id, user.coverImage);
    }

    return NextResponse.json({
      image: updated.image,
      coverImage: updated.coverImage,
      coverPositionX: updated.coverPositionX,
      coverPositionY: updated.coverPositionY,
      coverZoom: updated.coverZoom,
    });
  } catch (error) {
    await Promise.all([
      removeWrittenFile(newProfilePath),
      removeWrittenFile(newCoverPath),
    ]);

    if (error instanceof ProfileMediaError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Profile media upload failed", error);
    return NextResponse.json({ error: "Could not save your photo. Please try again." }, { status: 500 });
  }
}
