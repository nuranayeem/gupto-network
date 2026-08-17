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

const aboutFieldSchema = z.enum([
  "bio",
  "location",
  "hometown",
  "school",
  "college",
  "university",
  "relationshipStatus",
  "gender",
  "workplace",
  "interests",
  "socialLinks",
  "website",
  "category",
  "birthDate",
  "email",
  "phoneNumber",
]);

const updateSchema = z.object({
  field: aboutFieldSchema,
  value: z.unknown(),
});

const deleteSchema = z.object({ field: aboutFieldSchema });

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

const userSelect = {
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
  avatarTheme: true,
  birthDate: true,
  category: true,
  createdAt: true,
  _count: { select: { posts: true } },
} as const;

function toCurrentUser(user: {
  email: string;
  aboutEmail: string | null;
  aboutEmailVisible: boolean;
  phoneNumber: string | null;
  name: string | null;
  username: string | null;
  bio: string | null;
  location: string | null;
  hometown: string | null;
  school: string | null;
  college: string | null;
  university: string | null;
  relationshipStatus: string | null;
  gender: string | null;
  workplaces: unknown;
  interests: string[];
  socialLinks: string[];
  website: string | null;
  image: string | null;
  coverImage: string | null;
  avatarTheme: string;
  birthDate: Date | null;
  category: string | null;
  createdAt: Date;
  _count: { posts: number };
}) {
  const name = user.name || user.username || user.email.split("@")[0] || "User";
  const username = user.username || user.email.split("@")[0] || "user";

  return {
    name,
    username,
    initials: getInitials(name),
    email: user.email,
    aboutEmail: user.aboutEmail || "",
    aboutEmailVisible: user.aboutEmailVisible,
    phoneNumber: user.phoneNumber || "",
    bio: user.bio || "",
    location: user.location || "",
    hometown: user.hometown || "",
    school: user.school || "",
    college: user.college || "",
    university: user.university || "",
    relationshipStatus: user.relationshipStatus || "",
    gender: user.gender || "",
    workplaces: parseProfileWorkplaces(user.workplaces),
    interests: user.interests || [],
    socialLinks: user.socialLinks || [],
    website: user.website || "",
    image: user.image,
    coverImage: user.coverImage,
    avatarTheme: user.avatarTheme,
    birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : "",
    category: user.category || "",
    joinedAt: user.createdAt.toISOString(),
    postCount: user._count.posts,
  };
}

async function getAuthenticatedUser() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return null;

  return prisma.user.findUnique({
    where: { email },
    select: { id: true, ...userSelect },
  });
}

function requireString(value: unknown) {
  return typeof value === "string" ? value.trim() : null;
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check this About value and try again." }, { status: 400 });
  }

  const { field, value } = parsed.data;
  let data: Parameters<typeof prisma.user.update>[0]["data"] = {};

  if (field === "workplace") {
    const workplaces = normalizeProfileWorkplaces(value);
    if (workplaces === null) {
      return NextResponse.json({ error: "Check your workplace names and links and try again." }, { status: 400 });
    }
    data = { workplaces };
  } else if (field === "interests") {
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
      return NextResponse.json({ error: "Choose interests from the available list." }, { status: 400 });
    }
    const interests = normalizeProfileInterests(value);
    if (interests === null) {
      return NextResponse.json({ error: "Choose interests from the available list." }, { status: 400 });
    }
    data = { interests };
  } else if (field === "socialLinks") {
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
      return NextResponse.json({ error: "Enter valid social links." }, { status: 400 });
    }
    const socialLinks = normalizeSocialLinks(value);
    if (socialLinks === null) {
      return NextResponse.json({ error: "Enter valid social links." }, { status: 400 });
    }
    data = { socialLinks };
  } else {
    const rawValue = requireString(value);
    if (rawValue === null) {
      return NextResponse.json({ error: "Please check this About value and try again." }, { status: 400 });
    }

    if (field === "bio") {
      if (rawValue.length > 160) return NextResponse.json({ error: "Bio can be up to 160 characters." }, { status: 400 });
      data = { bio: rawValue || null };
    }
    if (field === "location") {
      if (rawValue.length > 80) return NextResponse.json({ error: "Current location can be up to 80 characters." }, { status: 400 });
      data = { location: rawValue || null };
    }
    if (field === "hometown") {
      if (rawValue.length > 80) return NextResponse.json({ error: "Hometown can be up to 80 characters." }, { status: 400 });
      data = { hometown: rawValue || null };
    }
    if (field === "school") {
      if (rawValue.length > 120) return NextResponse.json({ error: "School can be up to 120 characters." }, { status: 400 });
      data = { school: rawValue || null };
    }
    if (field === "college") {
      if (rawValue.length > 120) return NextResponse.json({ error: "College can be up to 120 characters." }, { status: 400 });
      data = { college: rawValue || null };
    }
    if (field === "university") {
      if (rawValue.length > 120) return NextResponse.json({ error: "University can be up to 120 characters." }, { status: 400 });
      data = { university: rawValue || null };
    }
    if (field === "relationshipStatus") {
      if (rawValue && !isRelationshipStatus(rawValue)) return NextResponse.json({ error: "Choose a valid relationship status." }, { status: 400 });
      data = { relationshipStatus: rawValue || null };
    }
    if (field === "gender") {
      if (rawValue && !isProfileGender(rawValue)) return NextResponse.json({ error: "Choose a valid gender option." }, { status: 400 });
      data = { gender: rawValue || null };
    }
    if (field === "website") {
      if (rawValue.length > 200) return NextResponse.json({ error: "Website can be up to 200 characters." }, { status: 400 });
      const website = normalizeWebsite(rawValue);
      if (website === null) return NextResponse.json({ error: "Enter a valid website, for example gupto.com." }, { status: 400 });
      data = { website: website || null };
    }
    if (field === "category") {
      if (rawValue && !isProfileCategory(rawValue)) return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
      data = { category: rawValue || null };
    }
    if (field === "birthDate") {
      const birthDate = normalizeBirthDate(rawValue);
      if (birthDate === undefined) return NextResponse.json({ error: "Choose a valid birth date." }, { status: 400 });
      data = { birthDate };
    }
    if (field === "email") {
      if (rawValue.length > 254 || !validEmail(rawValue)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
      data = { aboutEmail: rawValue.toLowerCase(), aboutEmailVisible: true };
    }
    if (field === "phoneNumber") {
      if (rawValue.length > 32 || !validPhoneNumber(rawValue)) return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
      data = { phoneNumber: rawValue };
    }
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data, select: userSelect });
  return NextResponse.json({ user: toCurrentUser(updated) });
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid About field." }, { status: 400 });

  const field = parsed.data.field;
  let data: Parameters<typeof prisma.user.update>[0]["data"] = {};

  if (field === "bio") data = { bio: null };
  if (field === "location") data = { location: null };
  if (field === "hometown") data = { hometown: null };
  if (field === "school") data = { school: null };
  if (field === "college") data = { college: null };
  if (field === "university") data = { university: null };
  if (field === "relationshipStatus") data = { relationshipStatus: null };
  if (field === "gender") data = { gender: null };
  if (field === "workplace") data = { workplaces: [] };
  if (field === "interests") data = { interests: [] };
  if (field === "socialLinks") data = { socialLinks: [] };
  if (field === "website") data = { website: null };
  if (field === "category") data = { category: null };
  if (field === "birthDate") data = { birthDate: null };
  if (field === "email") data = { aboutEmail: null, aboutEmailVisible: false };
  if (field === "phoneNumber") data = { phoneNumber: null };

  const updated = await prisma.user.update({ where: { id: user.id }, data, select: userSelect });
  return NextResponse.json({ user: toCurrentUser(updated) });
}
