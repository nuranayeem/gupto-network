import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isProfileCategory } from "@/lib/profile-categories";
import { isRelationshipStatus } from "@/lib/relationship-status";
import { isProfileGender } from "@/lib/profile-genders";
import { normalizeProfileInterests } from "@/lib/profile-interests";
import { normalizeSocialLinks } from "@/lib/profile-social-links";
import { normalizeProfileWorkplaces, parseProfileWorkplaces } from "@/lib/profile-workplaces";
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/lib/signup-validation";

const englishNamePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const usernamePattern = /^[A-Za-z0-9_]+$/;
const usernameHasLetterPattern = /[A-Za-z]/;
const avatarThemeSchema = z.enum(["midnight", "violet", "ocean", "mint", "sunset", "rose"]);

const profileSchema = z.object({
  name: z.string().trim().min(NAME_MIN_LENGTH).max(NAME_MAX_LENGTH),
  username: z.string().trim().min(USERNAME_MIN_LENGTH).max(USERNAME_MAX_LENGTH),
  bio: z.string().trim().max(160),
  location: z.string().trim().max(80),
  hometown: z.string().trim().max(80),
  school: z.string().trim().max(120),
  college: z.string().trim().max(120),
  university: z.string().trim().max(120),
  relationshipStatus: z.string().trim().refine((value) => value === "" || isRelationshipStatus(value)),
  gender: z.string().trim().refine((value) => value === "" || isProfileGender(value)),
  workplaces: z.array(z.object({ name: z.string().max(120), url: z.string().max(500) })).max(20),
  interests: z.array(z.string().trim().max(80)),
  socialLinks: z.array(z.string().trim().max(500)),
  aboutEmail: z.string().trim().max(254),
  phoneNumber: z.string().trim().max(32),
  website: z.string().trim().max(200),
  avatarTheme: avatarThemeSchema,
  birthDate: z.string().trim().max(10),
  category: z.string().trim().refine((value) => value === "" || isProfileCategory(value)),
});

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function normalizeWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeBirthDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined;

  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== trimmed) return undefined;

  const today = new Date();
  const todayText = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
    .toISOString()
    .slice(0, 10);

  if (trimmed > todayText || trimmed < "1900-01-01") return undefined;
  return date;
}


function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPhoneNumber(value: string) {
  if (!/^[0-9+().\-\s]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 20;
}

export async function PATCH(request: Request) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your profile details and try again." }, { status: 400 });
  }

  const name = parsed.data.name;
  const username = parsed.data.username.toLowerCase();
  const website = normalizeWebsite(parsed.data.website);
  const birthDate = normalizeBirthDate(parsed.data.birthDate);
  const aboutEmail = parsed.data.aboutEmail.trim().toLowerCase();
  const phoneNumber = parsed.data.phoneNumber.trim();
  const interests = normalizeProfileInterests(parsed.data.interests);
  const socialLinks = normalizeSocialLinks(parsed.data.socialLinks);
  const workplaces = normalizeProfileWorkplaces(parsed.data.workplaces);

  if (!englishNamePattern.test(name)) {
    return NextResponse.json({ error: "Name can contain English letters and single spaces only." }, { status: 400 });
  }

  if (!usernamePattern.test(username) || !usernameHasLetterPattern.test(username)) {
    return NextResponse.json({ error: "Username can use letters, numbers, and underscores, and needs at least one letter." }, { status: 400 });
  }

  if (website === null) {
    return NextResponse.json({ error: "Enter a valid website, for example gupto.com." }, { status: 400 });
  }

  if (birthDate === undefined) {
    return NextResponse.json({ error: "Choose a valid birth date." }, { status: 400 });
  }

  if (aboutEmail && !validEmail(aboutEmail)) {
    return NextResponse.json({ error: "Enter a valid About email address." }, { status: 400 });
  }

  if (phoneNumber && !validPhoneNumber(phoneNumber)) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }

  if (interests === null) {
    return NextResponse.json({ error: "Choose interests from the available list." }, { status: 400 });
  }

  if (socialLinks === null) {
    return NextResponse.json({ error: "Enter a valid social link, for example https://instagram.com/username." }, { status: 400 });
  }

  if (workplaces === null) {
    return NextResponse.json({ error: "Check your workplace names and links and try again." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, username: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User account not found." }, { status: 401 });
  }

  if (username !== user.username) {
    const now = new Date();
    const [existingUser, pendingSignup] = await Promise.all([
      prisma.user.findFirst({
        where: { username, NOT: { id: user.id } },
        select: { id: true },
      }),
      prisma.pendingSignup.findFirst({
        where: { username, expiresAt: { gt: now } },
        select: { id: true },
      }),
    ]);

    if (existingUser || pendingSignup) {
      return NextResponse.json({ error: "That username is already taken. Try another one." }, { status: 409 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      username,
      bio: parsed.data.bio || null,
      location: parsed.data.location || null,
      hometown: parsed.data.hometown || null,
      school: parsed.data.school || null,
      college: parsed.data.college || null,
      university: parsed.data.university || null,
      relationshipStatus: parsed.data.relationshipStatus || null,
      gender: parsed.data.gender || null,
      workplaces,
      interests,
      socialLinks,
      aboutEmail: aboutEmail || null,
      aboutEmailVisible: Boolean(aboutEmail),
      phoneNumber: phoneNumber || null,
      website: website || null,
      avatarTheme: parsed.data.avatarTheme,
      birthDate,
      category: parsed.data.category || null,
    },
    select: {
      email: true,
      aboutEmail: true,
      aboutEmailVisible: true,
      phoneNumber: true,
      name: true,
      username: true,
      bio: true,
      location: true,
      hometown: true,
      school: true,
      college: true,
      university: true,
      relationshipStatus: true,
      gender: true,
      workplaces: true,
      interests: true,
      socialLinks: true,
      website: true,
      image: true,
      coverImage: true,
      coverPositionX: true,
      coverPositionY: true,
      coverZoom: true,
      avatarTheme: true,
      birthDate: true,
      category: true,
      createdAt: true,
      _count: { select: { posts: true } },
    },
  });

  const updatedName = updated.name || updated.username || updated.email.split("@")[0] || "User";
  const updatedUsername = updated.username || updated.email.split("@")[0] || "user";

  return NextResponse.json({
    user: {
      name: updatedName,
      username: updatedUsername,
      initials: getInitials(updatedName),
      email: updated.email,
      aboutEmail: updated.aboutEmail || "",
      aboutEmailVisible: updated.aboutEmailVisible,
      phoneNumber: updated.phoneNumber || "",
      bio: updated.bio || "",
      location: updated.location || "",
      hometown: updated.hometown || "",
      school: updated.school || "",
      college: updated.college || "",
      university: updated.university || "",
      relationshipStatus: updated.relationshipStatus || "",
      gender: updated.gender || "",
      workplaces: parseProfileWorkplaces(updated.workplaces),
      interests: updated.interests || [],
      socialLinks: updated.socialLinks || [],
      website: updated.website || "",
      image: updated.image,
      coverImage: updated.coverImage,
      coverPositionX: updated.coverPositionX,
      coverPositionY: updated.coverPositionY,
      coverZoom: updated.coverZoom,
      avatarTheme: updated.avatarTheme,
      birthDate: updated.birthDate ? updated.birthDate.toISOString().slice(0, 10) : "",
      category: updated.category || "",
      joinedAt: updated.createdAt.toISOString(),
      postCount: updated._count.posts,
    },
  });
}
