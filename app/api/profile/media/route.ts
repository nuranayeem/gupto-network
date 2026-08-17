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

  const profileFile = profileValue instanceof File && profileValue.size > 0 ? profileValue : null;
  const coverFile = coverValue instanceof File && coverValue.size > 0 ? coverValue : null;

  if (!profileFile && !coverFile && !removeProfile && !removeCover) {
    return NextResponse.json({ error: "Choose a profile or cover photo first." }, { status: 400 });
  }

  let nextImage = user.image;
  let nextCoverImage = user.coverImage;
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
    } else if (removeCover) {
      nextCoverImage = null;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        image: nextImage,
        coverImage: nextCoverImage,
      },
      select: {
        image: true,
        coverImage: true,
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
