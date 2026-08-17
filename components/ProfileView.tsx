"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { createPortal } from "react-dom";
import type { AvatarTheme, CurrentUser, ProfileWorkplace } from "@/types/current-user";
import type { Post } from "@/types/social";
import { PROFILE_CATEGORIES, getProfileCategoryLabel } from "@/lib/profile-categories";
import { RELATIONSHIP_STATUSES, getRelationshipStatusLabel } from "@/lib/relationship-status";
import { PROFILE_GENDERS, getProfileGenderLabel } from "@/lib/profile-genders";
import { PROFILE_INTERESTS, getProfileInterestLabel } from "@/lib/profile-interests";
import { getSocialLinkHostname, getSocialLinkLabel, normalizeSocialLink } from "@/lib/profile-social-links";
import PostCard from "./PostCard";
import ThemeToggle from "./ThemeToggle";
import UserAvatar from "./UserAvatar";

type ProfileViewProps = {
  currentUser: CurrentUser;
  posts: Post[];
  bookmarks: Set<string>;
  onToggleTheme: () => void;
  onToggleLike: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onProfileUpdated: (user: CurrentUser) => void;
  onShowToast: (message: string) => void;
};

type DraftProfile = {
  name: string;
  username: string;
  bio: string;
  location: string;
  hometown: string;
  school: string;
  college: string;
  university: string;
  relationshipStatus: string;
  gender: string;
  workplaces: ProfileWorkplace[];
  interests: string[];
  socialLinks: string[];
  aboutEmail: string;
  phoneNumber: string;
  website: string;
  avatarTheme: AvatarTheme;
  birthDate: string;
  category: string;
};

type AboutField =
  | "bio"
  | "location"
  | "hometown"
  | "school"
  | "college"
  | "university"
  | "relationshipStatus"
  | "gender"
  | "workplace"
  | "interests"
  | "socialLinks"
  | "website"
  | "category"
  | "birthDate"
  | "email"
  | "phoneNumber";

const ABOUT_FIELD_LABELS: Record<AboutField, string> = {
  bio: "Bio",
  location: "Current location",
  hometown: "Hometown",
  school: "School",
  college: "College",
  university: "University",
  relationshipStatus: "Relationship status",
  gender: "Gender",
  workplace: "Workplace",
  interests: "Interests",
  socialLinks: "Social links",
  website: "Website",
  category: "Category",
  birthDate: "Birth date",
  email: "Email",
  phoneNumber: "Phone number",
};

const MAX_MEDIA_BYTES = 100 * 1024 * 1024;
const browserPreviewTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
]);

const adjustableProfileTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/bmp",
]);

const AVATAR_CROP_BOX = 176;
const AVATAR_ZOOM_MIN = 1;
const AVATAR_ZOOM_MAX = 3;
const AVATAR_NUDGE = 8;

type AvatarAdjustment = {
  x: number;
  y: number;
  zoom: number;
};

type ImageNaturalSize = {
  width: number;
  height: number;
};

const DEFAULT_AVATAR_ADJUSTMENT: AvatarAdjustment = {
  x: 0,
  y: 0,
  zoom: 1,
};


type FontAwesomeCategoryIconDefinition = {
  width: number;
  height: number;
  path: string;
};

// Font Awesome Free (solid) category icons are embedded as SVG path data so the
// profile badge gets genuine Font Awesome artwork without adding a runtime
// package/CDN dependency to the existing Gupto Network setup.
const PROFILE_CATEGORY_ICONS: Record<string, FontAwesomeCategoryIconDefinition> = {
  Student: {
    width: 640,
    height: 512,
    path: "M320 32c-8.1 0-16.1 1.4-23.7 4.1L15.8 137.4C6.3 140.9 0 149.9 0 160s6.3 19.1 15.8 22.6l57.9 20.9C57.3 229.3 48 259.8 48 291.9l0 28.1c0 28.4-10.8 57.7-22.3 80.8c-6.5 13-13.9 25.8-22.5 37.6C0 442.7-.9 448.3 .9 453.4s6 8.9 11.2 10.2l64 16c4.2 1.1 8.7 .3 12.4-2s6.3-6.1 7.1-10.4c8.6-42.8 4.3-81.2-2.1-108.7C90.3 344.3 86 329.8 80 316.5l0-24.6c0-30.2 10.2-58.7 27.9-81.5c12.9-15.5 29.6-28 49.2-35.7l157-61.7c8.2-3.2 17.5 .8 20.7 9s-.8 17.5-9 20.7l-157 61.7c-12.4 4.9-23.3 12.4-32.2 21.6l159.6 57.6c7.6 2.7 15.6 4.1 23.7 4.1s16.1-1.4 23.7-4.1L624.2 182.6c9.5-3.4 15.8-12.5 15.8-22.6s-6.3-19.1-15.8-22.6L343.7 36.1C336.1 33.4 328.1 32 320 32zM128 408c0 35.3 86 72 192 72s192-36.7 192-72L496.7 262.6 354.5 314c-11.1 4-22.8 6-34.5 6s-23.5-2-34.5-6L143.3 262.6 128 408z",
  },
  "Content Creator": {
    width: 576,
    height: 512,
    path: "M0 128C0 92.7 28.7 64 64 64l256 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128zM559.1 99.8c10.4 5.6 16.9 16.4 16.9 28.2l0 256c0 11.8-6.5 22.6-16.9 28.2s-23 5-32.9-1.6l-96-64L416 337.1l0-17.1 0-128 0-17.1 14.2-9.5 96-64c9.8-6.5 22.4-7.2 32.9-1.6z",
  },
  Entrepreneur: {
    width: 512,
    height: 512,
    path: "M156.6 384.9L125.7 354c-8.5-8.5-11.5-20.8-7.7-32.2c3-8.9 7-20.5 11.8-33.8L24 288c-8.6 0-16.6-4.6-20.9-12.1s-4.2-16.7 .2-24.1l52.5-88.5c13-21.9 36.5-35.3 61.9-35.3l82.3 0c2.4-4 4.8-7.7 7.2-11.3C289.1-4.1 411.1-8.1 483.9 5.3c11.6 2.1 20.6 11.2 22.8 22.8c13.4 72.9 9.3 194.8-111.4 276.7c-3.5 2.4-7.3 4.8-11.3 7.2l0 82.3c0 25.4-13.4 49-35.3 61.9l-88.5 52.5c-7.4 4.4-16.6 4.5-24.1 .2s-12.1-12.2-12.1-20.9l0-107.2c-14.1 4.9-26.4 8.9-35.7 11.9c-11.2 3.6-23.4 .5-31.8-7.8zM384 168a40 40 0 1 0 0-80 40 40 0 1 0 0 80z",
  },
  "Business Owner": {
    width: 512,
    height: 512,
    path: "M184 48l144 0c4.4 0 8 3.6 8 8l0 40L176 96l0-40c0-4.4 3.6-8 8-8zm-56 8l0 40L64 96C28.7 96 0 124.7 0 160l0 96 192 0 128 0 192 0 0-96c0-35.3-28.7-64-64-64l-64 0 0-40c0-30.9-25.1-56-56-56L184 0c-30.9 0-56 25.1-56 56zM512 288l-192 0 0 32c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-32L0 288 0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-128z",
  },
  Professional: {
    width: 448,
    height: 512,
    path: "M96 128a128 128 0 1 0 256 0A128 128 0 1 0 96 128zm94.5 200.2l18.6 31L175.8 483.1l-36-146.9c-2-8.1-9.8-13.4-17.9-11.3C51.9 342.4 0 405.8 0 481.3c0 17 13.8 30.7 30.7 30.7l131.7 0c0 0 0 0 .1 0l5.5 0 112 0 5.5 0c0 0 0 0 .1 0l131.7 0c17 0 30.7-13.8 30.7-30.7c0-75.5-51.9-138.9-121.9-156.4c-8.1-2-15.9 3.3-17.9 11.3l-36 146.9L238.9 359.2l18.6-31c6.4-10.7-1.3-24.2-13.7-24.2L224 304l-19.7 0c-12.4 0-20.1 13.6-13.7 24.2z",
  },
  "Developer / Tech": {
    width: 640,
    height: 512,
    path: "M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z",
  },
  Designer: {
    width: 512,
    height: 512,
    path: "M469.3 19.3l23.4 23.4c25 25 25 65.5 0 90.5l-56.4 56.4L322.3 75.7l56.4-56.4c25-25 65.5-25 90.5 0zM44.9 353.2L299.7 98.3 413.7 212.3 158.8 467.1c-6.7 6.7-15.1 11.6-24.2 14.2l-104 29.7c-8.4 2.4-17.4 .1-23.6-6.1s-8.5-15.2-6.1-23.6l29.7-104c2.6-9.2 7.5-17.5 14.2-24.2zM249.4 103.4L103.4 249.4 16 161.9c-18.7-18.7-18.7-49.1 0-67.9L94.1 16c18.7-18.7 49.1-18.7 67.9 0l19.8 19.8c-.3 .3-.7 .6-1 .9l-64 64c-6.2 6.2-6.2 16.4 0 22.6s16.4 6.2 22.6 0l64-64c.3-.3 .6-.7 .9-1l45.1 45.1zM408.6 262.6l45.1 45.1c-.3 .3-.7 .6-1 .9l-64 64c-6.2 6.2-6.2 16.4 0 22.6s16.4 6.2 22.6 0l64-64c.3-.3 .6-.7 .9-1L496 350.1c18.7 18.7 18.7 49.1 0 67.9L417.9 496c-18.7 18.7-49.1 18.7-67.9 0l-87.4-87.4L408.6 262.6z",
  },
  Writer: {
    width: 512,
    height: 512,
    path: "M368.4 18.3L312.7 74.1 437.9 199.3l55.7-55.7c21.9-21.9 21.9-57.3 0-79.2L447.6 18.3c-21.9-21.9-57.3-21.9-79.2 0zM288 94.6l-9.2 2.8L134.7 140.6c-19.9 6-35.7 21.2-42.3 41L3.8 445.8c-3.8 11.3-1 23.9 7.3 32.4L164.7 324.7c-3-6.3-4.7-13.3-4.7-20.7c0-26.5 21.5-48 48-48s48 21.5 48 48s-21.5 48-48 48c-7.4 0-14.4-1.7-20.7-4.7L33.7 500.9c8.6 8.3 21.1 11.2 32.4 7.3l264.3-88.6c19.7-6.6 35-22.4 41-42.3l43.2-144.1 2.7-9.2L288 94.6z",
  },
  "Artist / Musician": {
    width: 512,
    height: 512,
    path: "M499.1 6.3c8.1 6 12.9 15.6 12.9 25.7l0 72 0 264c0 44.2-43 80-96 80s-96-35.8-96-80s43-80 96-80c11.2 0 22 1.6 32 4.6L448 147 192 223.8 192 432c0 44.2-43 80-96 80s-96-35.8-96-80s43-80 96-80c11.2 0 22 1.6 32 4.6L128 200l0-72c0-14.1 9.3-26.6 22.8-30.7l320-96c9.7-2.9 20.2-1.1 28.3 5z",
  },
  Photographer: {
    width: 512,
    height: 512,
    path: "M149.1 64.8L138.7 96 64 96C28.7 96 0 124.7 0 160L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64l-74.7 0L362.9 64.8C356.4 45.2 338.1 32 317.4 32L194.6 32c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z",
  },
  "Teacher / Educator": {
    width: 640,
    height: 512,
    path: "M160 64c0-35.3 28.7-64 64-64L576 0c35.3 0 64 28.7 64 64l0 288c0 35.3-28.7 64-64 64l-239.2 0c-11.8-25.5-29.9-47.5-52.4-64l99.6 0 0-32c0-17.7 14.3-32 32-32l64 0c17.7 0 32 14.3 32 32l0 32 64 0 0-288L224 64l0 49.1C205.2 102.2 183.3 96 160 96l0-32zm0 64a96 96 0 1 1 0 192 96 96 0 1 1 0-192zM133.3 352l53.3 0C260.3 352 320 411.7 320 485.3c0 14.7-11.9 26.7-26.7 26.7L26.7 512C11.9 512 0 500.1 0 485.3C0 411.7 59.7 352 133.3 352z",
  },
  Gamer: {
    width: 640,
    height: 512,
    path: "M192 64C86 64 0 150 0 256S86 448 192 448l256 0c106 0 192-86 192-192s-86-192-192-192L192 64zM496 168a40 40 0 1 1 0 80 40 40 0 1 1 0-80zM392 304a40 40 0 1 1 80 0 40 40 0 1 1 -80 0zM168 200c0-13.3 10.7-24 24-24s24 10.7 24 24l0 32 32 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-32 0 0 32c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-32-32 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l32 0 0-32z",
  },
  "Sports / Fitness": {
    width: 640,
    height: 512,
    path: "M96 64c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32l0 160 0 64 0 160c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-64-32 0c-17.7 0-32-14.3-32-32l0-64c-17.7 0-32-14.3-32-32s14.3-32 32-32l0-64c0-17.7 14.3-32 32-32l32 0 0-64zm448 0l0 64 32 0c17.7 0 32 14.3 32 32l0 64c17.7 0 32 14.3 32 32s-14.3 32-32 32l0 64c0 17.7-14.3 32-32 32l-32 0 0 64c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-160 0-64 0-160c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32zM416 224l0 64-192 0 0-64 192 0z",
  },
  "Travel Creator": {
    width: 576,
    height: 512,
    path: "M482.3 192C516.5 192 576 221 576 256C576 292 516.5 320 482.3 320H365.7L265.2 495.9C259.5 505.8 248.9 512 237.4 512H181.2C170.6 512 162.9 501.8 165.8 491.6L214.9 320H112L68.8 377.6C65.78 381.6 61.04 384 56 384H14.03C6.284 384 0 377.7 0 369.1C0 368.7 .1818 367.4 .5398 366.1L32 256L.5398 145.9C.1818 144.6 0 143.3 0 142C0 134.3 6.284 128 14.03 128H56C61.04 128 65.78 130.4 68.8 134.4L112 192H214.9L165.8 20.4C162.9 10.17 170.6 0 181.2 0H237.4C248.9 0 259.5 6.153 265.2 16.12L365.7 192H482.3z",
  },
  "Food Vlogger": {
    width: 448,
    height: 512,
    path: "M416 0C400 0 288 32 288 176l0 112c0 35.3 28.7 64 64 64l32 0 0 128c0 17.7 14.3 32 32 32s32-14.3 32-32l0-128 0-112 0-208c0-17.7-14.3-32-32-32zM64 16C64 7.8 57.9 1 49.7 .1S34.2 4.6 32.4 12.5L2.1 148.8C.7 155.1 0 161.5 0 167.9c0 45.9 35.1 83.6 80 87.7L80 480c0 17.7 14.3 32 32 32s32-14.3 32-32l0-224.4c44.9-4.1 80-41.8 80-87.7c0-6.4-.7-12.8-2.1-19.1L191.6 12.5c-1.8-8-9.3-13.3-17.4-12.4S160 7.8 160 16l0 134.2c0 5.4-4.4 9.8-9.8 9.8c-5.1 0-9.3-3.9-9.8-9L127.9 14.6C127.2 6.3 120.3 0 112 0s-15.2 6.3-15.9 14.6L83.7 151c-.5 5.1-4.7 9-9.8 9c-5.4 0-9.8-4.4-9.8-9.8L64 16zm48.3 152l-.3 0-.3 0 .3-.7 .3 .7z",
  },
  "Restaurant / Cafe": {
    width: 576,
    height: 512,
    path: "M495.5 223.2C491.6 223.7 487.6 224 483.4 224C457.4 224 434.2 212.6 418.3 195C402.4 212.6 379.2 224 353.1 224C327 224 303.8 212.6 287.9 195C272 212.6 248.9 224 222.7 224C196.7 224 173.5 212.6 157.6 195C141.7 212.6 118.5 224 92.36 224C88.3 224 84.21 223.7 80.24 223.2C24.92 215.8-1.255 150.6 28.33 103.8L85.66 13.13C90.76 4.979 99.87 0 109.6 0H466.4C476.1 0 485.2 4.978 490.3 13.13L547.6 103.8C577.3 150.7 551 215.8 495.5 223.2H495.5zM499.7 254.9C503.1 254.4 508 253.6 512 252.6V448C512 483.3 483.3 512 448 512H128C92.66 512 64 483.3 64 448V252.6C67.87 253.6 71.86 254.4 75.97 254.9L76.09 254.9C81.35 255.6 86.83 256 92.36 256C104.8 256 116.8 254.1 128 250.6V384H448V250.7C459.2 254.1 471.1 256 483.4 256C489 256 494.4 255.6 499.7 254.9L499.7 254.9z",
  },
  "Chef / Culinary": {
    width: 576,
    height: 512,
    path: "M240 144A96 96 0 1 0 48 144a96 96 0 1 0 192 0zm44.4 32C269.9 240.1 212.5 288 144 288C64.5 288 0 223.5 0 144S64.5 0 144 0c68.5 0 125.9 47.9 140.4 112l71.8 0c8.8-9.8 21.6-16 35.8-16l104 0c26.5 0 48 21.5 48 48s-21.5 48-48 48l-104 0c-14.2 0-27-6.2-35.8-16l-71.8 0zM144 80a64 64 0 1 1 0 128 64 64 0 1 1 0-128zM400 240c13.3 0 24 10.7 24 24l0 8 96 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-240 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l96 0 0-8c0-13.3 10.7-24 24-24zM288 464l0-112 224 0 0 112c0 26.5-21.5 48-48 48l-128 0c-26.5 0-48-21.5-48-48zM48 320l80 0 16 0 32 0c26.5 0 48 21.5 48 48s-21.5 48-48 48l-16 0c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-80c0-8.8 7.2-16 16-16zm128 64c8.8 0 16-7.2 16-16s-7.2-16-16-16l-16 0 0 32 16 0zM24 464l176 0c13.3 0 24 10.7 24 24s-10.7 24-24 24L24 512c-13.3 0-24-10.7-24-24s10.7-24 24-24z",
  },
  "Outdoor / Hiking": {
    width: 384,
    height: 512,
    path: "M192 48a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm51.3 182.7L224.2 307l49.7 49.7c9 9 14.1 21.2 14.1 33.9l0 89.4c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-82.7-73.9-73.9c-15.8-15.8-22.2-38.6-16.9-60.3l20.4-84c8.3-34.1 42.7-54.9 76.7-46.4c19 4.8 35.6 16.4 46.4 32.7L305.1 208l30.9 0 0-24c0-13.3 10.7-24 24-24s24 10.7 24 24l0 55.8c0 .1 0 .2 0 .2s0 .2 0 .2L384 488c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-216-39.4 0c-16 0-31-8-39.9-21.4l-13.3-20zM81.1 471.9L117.3 334c3 4.2 6.4 8.2 10.1 11.9l41.9 41.9L142.9 488.1c-4.5 17.1-22 27.3-39.1 22.8s-27.3-22-22.8-39.1zm55.5-346L101.4 266.5c-3 12.1-14.9 19.9-27.2 17.9l-47.9-8c-14-2.3-22.9-16.3-19.2-30L31.9 155c9.5-34.8 41.1-59 77.2-59l4.2 0c15.6 0 27.1 14.7 23.3 29.8z",
  },
  "Lifestyle Creator": {
    width: 512,
    height: 512,
    path: "M0 190.9V185.1C0 115.2 50.52 55.58 119.4 44.1C164.1 36.51 211.4 51.37 244 84.02L256 96L267.1 84.02C300.6 51.37 347 36.51 392.6 44.1C461.5 55.58 512 115.2 512 185.1V190.9C512 232.4 494.8 272.1 464.4 300.4L283.7 469.1C276.2 476.1 266.3 480 256 480C245.7 480 235.8 476.1 228.3 469.1L47.59 300.4C17.23 272.1 .0003 232.4 .0003 190.9L0 190.9z",
  },
  "Fashion": {
    width: 576,
    height: 512,
    path: "M248.8 4.994C249.9 1.99 252.8 .0001 256 .0001C259.2 .0001 262.1 1.99 263.2 4.994L277.3 42.67L315 56.79C318 57.92 320 60.79 320 64C320 67.21 318 70.08 315 71.21L277.3 85.33L263.2 123C262.1 126 259.2 128 256 128C252.8 128 249.9 126 248.8 123L234.7 85.33L196.1 71.21C193.1 70.08 192 67.21 192 64C192 60.79 193.1 57.92 196.1 56.79L234.7 42.67L248.8 4.994zM427.4 14.06C446.2-4.686 476.6-4.686 495.3 14.06L529.9 48.64C548.6 67.38 548.6 97.78 529.9 116.5L148.5 497.9C129.8 516.6 99.38 516.6 80.64 497.9L46.06 463.3C27.31 444.6 27.31 414.2 46.06 395.4L427.4 14.06zM461.4 59.31L356.3 164.3L379.6 187.6L484.6 82.58L461.4 59.31zM7.491 117.2L64 96L85.19 39.49C86.88 34.98 91.19 32 96 32C100.8 32 105.1 34.98 106.8 39.49L128 96L184.5 117.2C189 118.9 192 123.2 192 128C192 132.8 189 137.1 184.5 138.8L128 160L106.8 216.5C105.1 221 100.8 224 96 224C91.19 224 86.88 221 85.19 216.5L64 160L7.491 138.8C2.985 137.1 0 132.8 0 128C0 123.2 2.985 118.9 7.491 117.2zM359.5 373.2L416 352L437.2 295.5C438.9 290.1 443.2 288 448 288C452.8 288 457.1 290.1 458.8 295.5L480 352L536.5 373.2C541 374.9 544 379.2 544 384C544 388.8 541 393.1 536.5 394.8L480 416L458.8 472.5C457.1 477 452.8 480 448 480C443.2 480 438.9 477 437.2 472.5L416 416L359.5 394.8C354.1 393.1 352 388.8 352 384C352 379.2 354.1 374.9 359.5 373.2z",
  },
  "Health / Wellness": {
    width: 512,
    height: 512,
    path: "M228.3 469.1L47.6 300.4c-4.2-3.9-8.2-8.1-11.9-12.4l87 0c22.6 0 43-13.6 51.7-34.5l10.5-25.2 49.3 109.5c3.8 8.5 12.1 14 21.4 14.1s17.8-5 22-13.3L320 253.7l1.7 3.4c9.5 19 28.9 31 50.1 31l104.5 0c-3.7 4.3-7.7 8.5-11.9 12.4L283.7 469.1c-7.5 7-17.4 10.9-27.7 10.9s-20.2-3.9-27.7-10.9zM503.7 240l-132 0c-3 0-5.8-1.7-7.2-4.4l-23.2-46.3c-4.1-8.1-12.4-13.3-21.5-13.3s-17.4 5.1-21.5 13.3l-41.4 82.8L205.9 158.2c-3.9-8.7-12.7-14.3-22.2-14.1s-18.1 5.9-21.8 14.8l-31.8 76.3c-1.2 3-4.2 4.9-7.4 4.9L16 240c-2.6 0-5 .4-7.3 1.1C3 225.2 0 208.2 0 190.9l0-5.8c0-69.9 50.5-129.5 119.4-141C165 36.5 211.4 51.4 244 84l12 12 12-12c32.6-32.6 79-47.5 124.6-39.9C461.5 55.6 512 115.2 512 185.1l0 5.8c0 16.9-2.8 33.5-8.3 49.1z",
  },
  "Tech / Gadgets": {
    width: 576,
    height: 512,
    path: "M64 0C28.7 0 0 28.7 0 64L0 352c0 35.3 28.7 64 64 64l176 0-10.7 32L160 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l256 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-69.3 0L336 416l176 0c35.3 0 64-28.7 64-64l0-288c0-35.3-28.7-64-64-64L64 0zM512 64l0 224L64 288 64 64l448 0z",
  },
  "Home / Living": {
    width: 576,
    height: 512,
    path: "M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9 .1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z",
  },
  "Parenting / Family": {
    width: 576,
    height: 512,
    path: "M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c.2 35.5-28.5 64.3-64 64.3l-320.4 0c-35.3 0-64-28.7-64-64l0-160.4-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24zM352 224a64 64 0 1 0 -128 0 64 64 0 1 0 128 0zm-96 96c-44.2 0-80 35.8-80 80c0 8.8 7.2 16 16 16l192 0c8.8 0 16-7.2 16-16c0-44.2-35.8-80-80-80l-64 0z",
  },
  "Entertainment / Events": {
    width: 640,
    height: 512,
    path: "M74.6 373.2c41.7 36.1 108 82.5 166.1 73.7c6.1-.9 12.1-2.5 18-4.5c-9.2-12.3-17.3-24.4-24.2-35.4c-21.9-35-28.8-75.2-25.9-113.6c-20.6 4.1-39.2 13-54.7 25.4c-6.5 5.2-16.3 1.3-14.8-7c6.4-33.5 33-60.9 68.2-66.3c2.6-.4 5.3-.7 7.9-.8l19.4-131.3c2-13.8 8-32.7 25-45.9C278.2 53.2 310.5 37 363.2 32.2c-.8-.7-1.6-1.4-2.4-2.1C340.6 14.5 288.4-11.5 175.7 5.6S20.5 63 5.7 83.9C0 91.9-.8 102 .6 111.8L24.8 276.1c5.5 37.3 21.5 72.6 49.8 97.2zm87.7-219.6c4.4-3.1 10.8-2 11.8 3.3c.1 .5 .2 1.1 .3 1.6c3.2 21.8-11.6 42-33.1 45.3s-41.5-11.8-44.7-33.5c-.1-.5-.1-1.1-.2-1.6c-.6-5.4 5.2-8.4 10.3-6.7c9 3 18.8 3.9 28.7 2.4s19.1-5.3 26.8-10.8zM261.6 390c29.4 46.9 79.5 110.9 137.6 119.7s124.5-37.5 166.1-73.7c28.3-24.5 44.3-59.8 49.8-97.2l24.2-164.3c1.4-9.8 .6-19.9-5.1-27.9c-14.8-20.9-57.3-61.2-170-78.3S299.4 77.2 279.2 92.8c-7.8 6-11.5 15.4-12.9 25.2L242.1 282.3c-5.5 37.3-.4 75.8 19.6 107.7zM404.5 235.3c-7.7-5.5-16.8-9.3-26.8-10.8s-19.8-.6-28.7 2.4c-5.1 1.7-10.9-1.3-10.3-6.7c.1-.5 .1-1.1 .2-1.6c3.2-21.8 23.2-36.8 44.7-33.5s36.3 23.5 33.1 45.3c-.1 .5-.2 1.1-.3 1.6c-1 5.3-7.4 6.4-11.8 3.3zm136.2 15.5c-1 5.3-7.4 6.4-11.8 3.3c-7.7-5.5-16.8-9.3-26.8-10.8s-19.8-.6-28.7 2.4c-5.1 1.7-10.9-1.3-10.3-6.7c.1-.5 .1-1.1 .2-1.6c3.2-21.8 23.2-36.8 44.7-33.5s36.3 23.5 33.1 45.3c-.1 .5-.2 1.1-.3 1.6zM530 350.2c-19.6 44.7-66.8 72.5-116.8 64.9s-87.1-48.2-93-96.7c-1-8.3 8.9-12.1 15.2-6.7c23.9 20.8 53.6 35.3 87 40.3s66.1 .1 94.9-12.8c7.6-3.4 16 3.2 12.6 10.9z",
  },
  "Journalist / Media": {
    width: 512,
    height: 512,
    path: "M192 32c0 17.7 14.3 32 32 32c123.7 0 224 100.3 224 224c0 17.7 14.3 32 32 32s32-14.3 32-32C512 128.9 383.1 0 224 0c-17.7 0-32 14.3-32 32zm0 96c0 17.7 14.3 32 32 32c70.7 0 128 57.3 128 128c0 17.7 14.3 32 32 32s32-14.3 32-32c0-106-86-192-192-192c-17.7 0-32 14.3-32 32zM96 144c0-26.5-21.5-48-48-48S0 117.5 0 144L0 368c0 79.5 64.5 144 144 144s144-64.5 144-144s-64.5-144-144-144l-16 0 0 96 16 0c26.5 0 48 21.5 48 48s-21.5 48-48 48s-48-21.5-48-48l0-224z",
  },
  "Reviewer / Critic": {
    width: 576,
    height: 512,
    path: "M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z",
  },
  "Public Figure": {
    // Font Awesome Free solid bullhorn: a clearer influencer/public-voice symbol.
    width: 512,
    height: 512,
    path: "M480 32c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9L381.7 53c-48 48-113.1 75-181 75l-8.7 0-32 0-96 0c-35.3 0-64 28.7-64 64l0 96c0 35.3 28.7 64 64 64l0 128c0 17.7 14.3 32 32 32l64 0c17.7 0 32-14.3 32-32l0-128 8.7 0c67.9 0 133 27 181 75l43.6 43.6c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6l0-147.6c18.6-8.8 32-32.5 32-60.4s-13.4-51.6-32-60.4L480 32zm-64 76.7L416 240l0 131.3C357.2 317.8 280.5 288 200.7 288l-8.7 0 0-96 8.7 0c79.8 0 156.5-29.8 215.3-83.3z",
  },
  Other: {
    width: 512,
    height: 512,
    path: "M315.4 15.5C309.7 5.9 299.2 0 288 0s-21.7 5.9-27.4 15.5l-96 160c-5.9 9.9-6.1 22.2-.4 32.2s16.3 16.2 27.8 16.2l192 0c11.5 0 22.2-6.2 27.8-16.2s5.5-22.3-.4-32.2l-96-160zM288 312l0 144c0 22.1 17.9 40 40 40l144 0c22.1 0 40-17.9 40-40l0-144c0-22.1-17.9-40-40-40l-144 0c-22.1 0-40 17.9-40 40zM128 512a128 128 0 1 0 0-256 128 128 0 1 0 0 256z",
  },
};

function ProfileCategoryIcon({ category }: { category: string }) {
  const label = getProfileCategoryLabel(category);

  if (label === "Public Figure") {
    return (
      <svg
        className="profile-category-fa-icon"
        viewBox="-1 -1 18 18"
        aria-hidden="true"
        focusable="false"
        overflow="visible"
        data-fa-category-icon={label}
      >
        <path
          d="M10.067 2.271a2.91 2.91 0 0 0-4.134 0l-.622.638-.89-.011a2.91 2.91 0 0 0-2.924 2.924l.01.89-.636.622a2.91 2.91 0 0 0 0 4.134l.637.622-.011.89a2.91 2.91 0 0 0 2.924 2.924l.89-.01.622.636a2.91 2.91 0 0 0 4.134 0l.622-.637.89.011a2.91 2.91 0 0 0 2.924-2.924l-.01-.89.636-.622a2.91 2.91 0 0 0 0-4.134l-.637-.622.011-.89a2.91 2.91 0 0 0-2.924-2.924l-.89.01-.622-.636Z"
          fill="currentColor"
        />
        <path
          d="M4.7 8.2 6.9 10.4 11.35 5.95"
          fill="none"
          stroke="var(--surface-solid)"
          strokeWidth="1.95"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (label === "Fashion") {
    return (
      <span
        className="profile-category-fa-icon"
        aria-hidden="true"
        data-fa-category-icon={label}
        style={{
          backgroundColor: "currentColor",
          WebkitMaskImage: 'url("/images/category-icons/fashion.svg")',
          maskImage: 'url("/images/category-icons/fashion.svg")',
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    );
  }

  if (label === "Beauty") {
    return (
      <span
        className="profile-category-fa-icon"
        aria-hidden="true"
        data-fa-category-icon={label}
        style={{
          backgroundColor: "currentColor",
          WebkitMaskImage: 'url("/images/category-icons/beauty.svg")',
          maskImage: 'url("/images/category-icons/beauty.svg")',
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    );
  }

  const icon = PROFILE_CATEGORY_ICONS[label] ?? PROFILE_CATEGORY_ICONS.Other;

  return (
    <svg
      className="profile-category-fa-icon"
      viewBox={`0 0 ${icon.width} ${icon.height}`}
      aria-hidden="true"
      focusable="false"
      data-fa-category-icon={label}
    >
      <path d={icon.path} />
    </svg>
  );
}


function AboutFieldIcon({ field }: { field: AboutField }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    focusable: false,
    "data-about-outline-icon": field,
    style: {
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.8,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
    },
  };

  if (field === "bio") {
    return (
      <svg {...commonProps}>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <circle cx="8" cy="10" r="2" />
        <path d="M5.5 15c.7-1.6 1.7-2.4 2.5-2.4s1.8.8 2.5 2.4" />
        <path d="M13.5 9h4.5M13.5 12h4.5M13.5 15h3" />
      </svg>
    );
  }

  if (field === "location") {
    return (
      <svg {...commonProps}>
        <path d="M20 10c0 5.2-8 11-8 11S4 15.2 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  if (field === "hometown") {
    return (
      <svg {...commonProps}>
        <path d="m3.5 10.5 8.5-7 8.5 7" />
        <path d="M5.5 9.3V20h13V9.3" />
        <path d="M9.5 20v-6h5v6" />
      </svg>
    );
  }

  if (field === "relationshipStatus") {
    return (
      <svg {...commonProps}>
        <path d="M20.8 5.8a5.2 5.2 0 0 0-7.4 0L12 7.2l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 22l8.8-8.8a5.2 5.2 0 0 0 0-7.4Z" />
      </svg>
    );
  }

  if (field === "gender") {
    return (
      <svg {...commonProps}>
        <circle cx="10" cy="9" r="4" />
        <path d="M10 13v8M6.5 18h7" />
        <path d="M15.5 4.5h4v4M19.5 4.5l-4.1 4.1" />
      </svg>
    );
  }

  if (field === "workplace") {
    return (
      <svg {...commonProps}>
        <rect x="3" y="7" width="18" height="13" rx="2.5" />
        <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" />
        <path d="M3 12h18M10 12v2h4v-2" />
      </svg>
    );
  }

  if (field === "interests") {
    return (
      <svg {...commonProps}>
        <path d="M9 18h6" />
        <path d="M10 21h4" />
        <path d="M8.2 14.7C6.8 13.6 6 11.9 6 10a6 6 0 1 1 12 0c0 1.9-.8 3.6-2.2 4.7-.8.7-1.3 1.4-1.5 2.3H9.7c-.2-.9-.7-1.6-1.5-2.3Z" />
      </svg>
    );
  }

  if (field === "socialLinks") {
    return (
      <svg {...commonProps}>
        <path d="M10.2 13.8a4.2 4.2 0 0 0 5.9 0l2.7-2.7a4.2 4.2 0 0 0-5.9-5.9l-1.6 1.6" />
        <path d="M13.8 10.2a4.2 4.2 0 0 0-5.9 0l-2.7 2.7a4.2 4.2 0 0 0 5.9 5.9l1.6-1.6" />
      </svg>
    );
  }

  if (field === "school") {
    return (
      <svg {...commonProps}>
        <path d="M4 20V8.5L12 4l8 4.5V20" />
        <path d="M2.5 20h19" />
        <circle cx="12" cy="9" r="2" />
        <path d="M7 12.5h2v2H7zM15 12.5h2v2h-2zM10 20v-4h4v4" />
      </svg>
    );
  }

  if (field === "college") {
    return (
      <svg {...commonProps}>
        <path d="M3 9h18" />
        <path d="m4 8 8-5 8 5" />
        <path d="M5 9v9M9.5 9v9M14.5 9v9M19 9v9" />
        <path d="M3 18h18M2 21h20" />
      </svg>
    );
  }

  if (field === "university") {
    return (
      <svg {...commonProps}>
        <path d="m3 9 9-5 9 5-9 5-9-5Z" />
        <path d="M7 12v4.2c2.8 2.3 7.2 2.3 10 0V12" />
        <path d="M21 9v6" />
      </svg>
    );
  }

  if (field === "website") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21c-2.2-2.5-3.3-5.5-3.3-9S9.8 5.5 12 3Z" />
      </svg>
    );
  }

  if (field === "category") {
    return (
      <svg {...commonProps}>
        <path d="M20.5 13.5 13.5 20.5a2 2 0 0 1-2.8 0L3.5 13.3V4h9.3l7.7 7.7a1.3 1.3 0 0 1 0 1.8Z" />
        <circle cx="8" cy="8" r="1.4" />
      </svg>
    );
  }

  if (field === "birthDate") {
    return (
      <svg {...commonProps}>
        <rect x="3" y="5" width="18" height="16" rx="2.5" />
        <path d="M7 3v4M17 3v4M3 10h18" />
        <path d="M8 14h2M14 14h2M8 17.5h2M14 17.5h2" />
      </svg>
    );
  }

  if (field === "email") {
    return (
      <svg {...commonProps}>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="m4.5 7 7.5 6 7.5-6" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M7.5 4.5 10 9l-2.2 1.8a15.8 15.8 0 0 0 5.4 5.4L15 14l4.5 2.5v3c0 .9-.7 1.6-1.6 1.6C9.6 20.7 3.3 14.4 2.9 6.1 2.8 5.2 3.5 4.5 4.4 4.5h3.1Z" />
    </svg>
  );
}

function AboutRowActions({
  field,
  canDelete,
  onEdit,
  onDelete,
}: {
  field: AboutField;
  canDelete: boolean;
  onEdit: (field: AboutField) => void;
  onDelete: (field: AboutField) => void;
}) {
  const label = ABOUT_FIELD_LABELS[field];

  return (
    <div className="profile-about-actions" aria-label={`${label} actions`}>
      <button
        className="profile-about-action edit"
        type="button"
        aria-label={`Edit ${label}`}
        title={`Edit ${label}`}
        onClick={() => onEdit(field)}
      >
        {/* Font Awesome Free 6 — Pen To Square (Classic Solid) */}
        <svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">
          <path d="M490.3 40.4C512.2 62.27 512.2 97.73 490.3 119.6L460.3 149.7L362.3 51.72L392.4 21.66C414.3-.2135 449.7-.2135 471.6 21.66L490.3 40.4zM172.4 241.7L339.7 74.34L437.7 172.3L270.3 339.6C264.2 345.8 256.7 350.4 248.4 353.2L159.6 382.8C150.1 385.6 141.5 383.4 135 376.1C128.6 370.5 126.4 361 129.2 352.4L158.8 263.6C161.6 255.3 166.2 247.8 172.4 241.7V241.7zM192 63.1C209.7 63.1 224 78.33 224 95.1C224 113.7 209.7 127.1 192 127.1H96C78.33 127.1 64 142.3 64 159.1V416C64 433.7 78.33 448 96 448H352C369.7 448 384 433.7 384 416V319.1C384 302.3 398.3 287.1 416 287.1C433.7 287.1 448 302.3 448 319.1V416C448 469 405 512 352 512H96C42.98 512 0 469 0 416V159.1C0 106.1 42.98 63.1 96 63.1H192z" />
        </svg>
      </button>
      <button
        className="profile-about-action delete"
        type="button"
        aria-label={`Delete ${label}`}
        title={canDelete ? `Delete ${label}` : `${label} is already empty`}
        disabled={!canDelete}
        onClick={() => onDelete(field)}
      >
        {/* Font Awesome Free 6 — Trash Can (Classic Solid) */}
        <svg viewBox="0 0 448 512" aria-hidden="true" focusable="false">
          <path d="M135.2 17.69C140.6 6.848 151.7 0 163.8 0H284.2C296.3 0 307.4 6.848 312.8 17.69L320 32H416C433.7 32 448 46.33 448 64C448 81.67 433.7 96 416 96H32C14.33 96 0 81.67 0 64C0 46.33 14.33 32 32 32H128L135.2 17.69zM31.1 128H416V448C416 483.3 387.3 512 352 512H95.1C60.65 512 31.1 483.3 31.1 448V128zM111.1 208V432C111.1 440.8 119.2 448 127.1 448C136.8 448 143.1 440.8 143.1 432V208C143.1 199.2 136.8 192 127.1 192C119.2 192 111.1 199.2 111.1 208zM207.1 208V432C207.1 440.8 215.2 448 223.1 448C232.8 448 240 440.8 240 432V208C240 199.2 232.8 192 223.1 192C215.2 192 207.1 199.2 207.1 208zM304 208V432C304 440.8 311.2 448 320 448C328.8 448 336 440.8 336 432V208C336 199.2 328.8 192 320 192C311.2 192 304 199.2 304 208z" />
        </svg>
      </button>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getAvatarGeometry(
  natural: ImageNaturalSize,
  adjustment: AvatarAdjustment,
  box = AVATAR_CROP_BOX,
) {
  if (!natural.width || !natural.height) {
    return {
      scale: 1,
      renderWidth: box,
      renderHeight: box,
      left: 0,
      top: 0,
    };
  }

  const zoom = clamp(adjustment.zoom, AVATAR_ZOOM_MIN, AVATAR_ZOOM_MAX);
  const baseScale = Math.max(box / natural.width, box / natural.height);
  const scale = baseScale * zoom;
  const renderWidth = natural.width * scale;
  const renderHeight = natural.height * scale;

  const baseLeft = (box - renderWidth) / 2;
  const maxOffsetX = Math.max(0, (renderWidth - box) / 2);
  const minOffsetY = Math.min(0, box - renderHeight);

  const x = clamp(adjustment.x, -maxOffsetX, maxOffsetX);
  const y = clamp(adjustment.y, minOffsetY, 0);

  return {
    scale,
    renderWidth,
    renderHeight,
    left: baseLeft + x,
    top: y,
  };
}

function clampAvatarAdjustment(
  adjustment: AvatarAdjustment,
  natural: ImageNaturalSize,
  box = AVATAR_CROP_BOX,
): AvatarAdjustment {
  const zoom = clamp(adjustment.zoom, AVATAR_ZOOM_MIN, AVATAR_ZOOM_MAX);

  if (!natural.width || !natural.height) {
    return { x: 0, y: 0, zoom };
  }

  const baseScale = Math.max(box / natural.width, box / natural.height);
  const scale = baseScale * zoom;
  const renderWidth = natural.width * scale;
  const renderHeight = natural.height * scale;
  const maxOffsetX = Math.max(0, (renderWidth - box) / 2);
  const minOffsetY = Math.min(0, box - renderHeight);

  return {
    x: clamp(adjustment.x, -maxOffsetX, maxOffsetX),
    y: clamp(adjustment.y, minOffsetY, 0),
    zoom,
  };
}

function avatarAdjustmentChanged(adjustment: AvatarAdjustment) {
  return (
    Math.abs(adjustment.x) > 0.5 ||
    Math.abs(adjustment.y) > 0.5 ||
    Math.abs(adjustment.zoom - 1) > 0.001
  );
}

async function createAdjustedProfileFile(
  original: File,
  previewUrl: string,
  natural: ImageNaturalSize,
  adjustment: AvatarAdjustment,
) {
  const image = new Image();
  image.decoding = "async";
  image.src = previewUrl;

  await new Promise<void>((resolve, reject) => {
    if (image.complete && image.naturalWidth > 0) {
      resolve();
      return;
    }

    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not read the selected profile photo."));
  });

  const sourceNatural = {
    width: natural.width || image.naturalWidth,
    height: natural.height || image.naturalHeight,
  };
  const geometry = getAvatarGeometry(sourceNatural, adjustment);
  const sourceX = clamp(-geometry.left / geometry.scale, 0, sourceNatural.width);
  const sourceY = clamp(-geometry.top / geometry.scale, 0, sourceNatural.height);
  const sourceSize = Math.min(
    AVATAR_CROP_BOX / geometry.scale,
    sourceNatural.width - sourceX,
    sourceNatural.height - sourceY,
  );

  if (!Number.isFinite(sourceSize) || sourceSize <= 0) {
    throw new Error("Could not apply the profile photo position.");
  }

  const outputSize = Math.max(1, Math.round(sourceSize));
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    throw new Error("Could not prepare the adjusted profile photo.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    outputSize,
    outputSize,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Could not prepare the adjusted profile photo."));
    }, "image/png");
  });

  const cleanBase = original.name.replace(/\.[^.]+$/, "") || "profile-photo";
  return new File([blob], `${cleanBase}-adjusted.png`, {
    type: "image/png",
    lastModified: Date.now(),
  });
}

function monthYear(value: string) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(value));
}

function compactJoined(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(value));
}

function formatBirthDate(value: string) {
  if (!value) return "Not added yet";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00.000Z`));
}

function buildPreviewUrl(file: File) {
  return browserPreviewTypes.has(file.type.toLowerCase()) ? URL.createObjectURL(file) : "";
}


type PopoverPlacement = {
  top: number;
  left: number;
  width: number;
  placement: "top" | "bottom";
};

function useAnchoredPopover(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  preferredWidth: number,
  estimatedHeight: number,
) {
  const [position, setPosition] = useState<PopoverPlacement | null>(null);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const modal = trigger.closest(".profile-modal") as HTMLElement | null;
      const modalRect = modal?.getBoundingClientRect();
      const boundaryPadding = 12;
      const gap = 8;

      // Keep every editor popover inside the visible Edit Profile card instead
      // of clamping only to the browser viewport. This prevents the calendar
      // and category menu from escaping past the modal edge.
      const boundaryLeft = modalRect
        ? Math.max(boundaryPadding, modalRect.left + boundaryPadding)
        : boundaryPadding;
      const boundaryRight = modalRect
        ? Math.min(window.innerWidth - boundaryPadding, modalRect.right - boundaryPadding)
        : window.innerWidth - boundaryPadding;
      const boundaryTop = modalRect
        ? Math.max(boundaryPadding, modalRect.top + boundaryPadding)
        : boundaryPadding;
      const boundaryBottom = modalRect
        ? Math.min(window.innerHeight - boundaryPadding, modalRect.bottom - boundaryPadding)
        : window.innerHeight - boundaryPadding;

      const availableWidth = Math.max(0, boundaryRight - boundaryLeft);
      const width = Math.min(
        Math.max(rect.width, preferredWidth),
        availableWidth,
      );

      const left = Math.min(
        Math.max(rect.left, boundaryLeft),
        Math.max(boundaryLeft, boundaryRight - width),
      );

      const roomBelow = Math.max(0, boundaryBottom - rect.bottom - gap);
      const roomAbove = Math.max(0, rect.top - boundaryTop - gap);
      const shouldOpenAbove =
        roomBelow < estimatedHeight &&
        (roomAbove >= estimatedHeight || roomAbove > roomBelow);

      const desiredTop = shouldOpenAbove
        ? rect.top - gap - estimatedHeight
        : rect.bottom + gap;
      const maxTop = Math.max(boundaryTop, boundaryBottom - estimatedHeight);
      const top = Math.min(Math.max(desiredTop, boundaryTop), maxTop);

      setPosition({
        top,
        left,
        width,
        placement: shouldOpenAbove ? "top" : "bottom",
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, triggerRef, preferredWidth, estimatedHeight]);

  return position;
}

function AppleCategoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPopover(open, triggerRef, 280, 344);
  const selectedLabel =
    PROFILE_CATEGORIES.find((item) => item.value === value)?.label || "Choose a category";

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const node = event.target as Node;
      if (triggerRef.current?.contains(node) || popoverRef.current?.contains(node)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const popover =
    open && position && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            className="apple-popover apple-category-popover"
            data-placement={position.placement}
            style={{ top: position.top, left: position.left, width: position.width }}
            role="listbox"
            aria-label="Choose profile category"
          >
            <div className="apple-popover-cap">
              <strong>Category</strong>
              <small>Choose what describes you best.</small>
            </div>

            <div className="apple-category-options">
              <button
                type="button"
                role="option"
                aria-selected={!value}
                className={!value ? "selected" : ""}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <span>Choose a category</span>
                {!value ? <span className="apple-option-check" aria-hidden="true">✓</span> : null}
              </button>

              {PROFILE_CATEGORIES.map((category) => {
                const selected = category.value === value;
                return (
                  <button
                    key={category.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={selected ? "selected" : ""}
                    onClick={() => {
                      onChange(category.value);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                  >
                    <span>{category.label}</span>
                    {selected ? <span className="apple-option-check" aria-hidden="true">✓</span> : null}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`apple-field-trigger${open ? " open" : ""}${value ? " has-value" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{selectedLabel}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="m6.25 8 3.75 3.75L13.75 8" />
        </svg>
      </button>
      {popover}
    </>
  );
}

function AppleRelationshipPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPopover(open, triggerRef, 280, 330);
  const selectedLabel = getRelationshipStatusLabel(value) || "Choose a status";

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const node = event.target as Node;
      if (triggerRef.current?.contains(node) || popoverRef.current?.contains(node)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const popover =
    open && position && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            className="apple-popover apple-category-popover"
            data-placement={position.placement}
            style={{ top: position.top, left: position.left, width: position.width }}
            role="listbox"
            aria-label="Choose relationship status"
          >
            <div className="apple-popover-cap">
              <strong>Relationship status</strong>
              <small>Choose what you want to show on your profile.</small>
            </div>

            <div className="apple-category-options">
              <button
                type="button"
                role="option"
                aria-selected={!value}
                className={!value ? "selected" : ""}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <span>Choose a status</span>
                {!value ? <span className="apple-option-check" aria-hidden="true">✓</span> : null}
              </button>

              {RELATIONSHIP_STATUSES.map((status) => {
                const selected = status.value === value;
                return (
                  <button
                    key={status.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={selected ? "selected" : ""}
                    onClick={() => {
                      onChange(status.value);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                  >
                    <span>{status.label}</span>
                    {selected ? <span className="apple-option-check" aria-hidden="true">✓</span> : null}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`apple-field-trigger${open ? " open" : ""}${value ? " has-value" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedLabel}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="m6.25 8 3.75 3.75L13.75 8" />
        </svg>
      </button>
      {popover}
    </>
  );
}


function AppleGenderPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPopover(open, triggerRef, 280, 318);
  const selectedLabel = getProfileGenderLabel(value) || "Choose gender";

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const node = event.target as Node;
      if (triggerRef.current?.contains(node) || popoverRef.current?.contains(node)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const popover =
    open && position && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            className="apple-popover apple-category-popover"
            data-placement={position.placement}
            style={{ top: position.top, left: position.left, width: position.width }}
            role="listbox"
            aria-label="Choose gender"
          >
            <div className="apple-popover-cap">
              <strong>Gender</strong>
              <small>Optional. Choose what you want to show in About.</small>
            </div>
            <div className="apple-category-options">
              <button
                type="button"
                role="option"
                aria-selected={!value}
                className={!value ? "selected" : ""}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <span>Choose gender</span>
                {!value ? <span className="apple-option-check" aria-hidden="true">✓</span> : null}
              </button>
              {PROFILE_GENDERS.map((gender) => {
                const selected = gender.value === value;
                return (
                  <button
                    key={gender.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={selected ? "selected" : ""}
                    onClick={() => {
                      onChange(gender.value);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                  >
                    <span>{gender.label}</span>
                    {selected ? <span className="apple-option-check" aria-hidden="true">✓</span> : null}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`apple-field-trigger${open ? " open" : ""}${value ? " has-value" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedLabel}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6.25 8 3.75 3.75L13.75 8" /></svg>
      </button>
      {popover}
    </>
  );
}

function AppleInterestsPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (nextValue: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPopover(open, triggerRef, 330, 430);

  const selectedLabels = value.map(getProfileInterestLabel);
  const selectedLabel =
    selectedLabels.length === 0
      ? "Choose interests"
      : selectedLabels.length <= 2
        ? selectedLabels.join(", ")
        : `${selectedLabels.slice(0, 2).join(", ")} +${selectedLabels.length - 2}`;

  const filteredInterests = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return PROFILE_INTERESTS;
    return PROFILE_INTERESTS.filter((interest) => interest.label.toLowerCase().includes(normalized));
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const node = event.target as Node;
      if (triggerRef.current?.contains(node) || popoverRef.current?.contains(node)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggleInterest = (interest: string) => {
    onChange(value.includes(interest) ? value.filter((item) => item !== interest) : [...value, interest]);
  };

  const popover =
    open && position && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            className="apple-popover apple-category-popover"
            data-placement={position.placement}
            style={{ top: position.top, left: position.left, width: position.width }}
            role="listbox"
            aria-multiselectable="true"
            aria-label="Choose interests"
          >
            <div className="apple-popover-cap">
              <strong>Interests</strong>
              <small>{value.length ? `${value.length} selected` : "Choose one or more hobbies and interests."}</small>
            </div>
            <div style={{ padding: "8px 10px 4px" }}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search interests…"
                aria-label="Search interests"
                style={{
                  width: "100%",
                  minHeight: 38,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--surface-solid)",
                  color: "inherit",
                  padding: "0 12px",
                  outline: "none",
                }}
              />
            </div>
            <div className="apple-category-options" style={{ maxHeight: 278 }}>
              {filteredInterests.map((interest) => {
                const selected = value.includes(interest.value);
                return (
                  <button
                    key={interest.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={selected ? "selected" : ""}
                    onClick={() => toggleInterest(interest.value)}
                  >
                    <span>{interest.label}</span>
                    {selected ? <span className="apple-option-check" aria-hidden="true">✓</span> : null}
                  </button>
                );
              })}
              {filteredInterests.length === 0 ? (
                <div style={{ padding: "18px 14px", textAlign: "center", color: "var(--muted)" }}>No matching interests</div>
              ) : null}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "10px 12px", borderTop: "1px solid var(--border)" }}>
              <button className="profile-cancel-btn" type="button" onClick={() => onChange([])}>Clear</button>
              <button
                className="profile-save-btn"
                type="button"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                Done
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`apple-field-trigger${open ? " open" : ""}${value.length ? " has-value" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedLabel}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6.25 8 3.75 3.75L13.75 8" /></svg>
      </button>
      {popover}
    </>
  );
}

function SocialLinkLogo({ url, size = 22 }: { url: string; size?: number }) {
  const host = getSocialLinkHostname(url);
  const normalized = normalizeSocialLink(url);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [host]);

  const sources = useMemo(() => {
    if (!host || !normalized) return [];
    const origin = new URL(normalized).origin;
    return [
      `${origin}/favicon.ico`,
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`,
    ];
  }, [host, normalized]);

  if (!sources.length || sourceIndex >= sources.length) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}
      >
        <path d="M10.2 13.8a4.2 4.2 0 0 0 5.9 0l2.7-2.7a4.2 4.2 0 0 0-5.9-5.9l-1.6 1.6" />
        <path d="M13.8 10.2a4.2 4.2 0 0 0-5.9 0l-2.7 2.7a4.2 4.2 0 0 0 5.9 5.9l1.6-1.6" />
      </svg>
    );
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt=""
      aria-hidden="true"
      referrerPolicy="no-referrer"
      onError={() => setSourceIndex((current) => current + 1)}
      style={{ width: size, height: size, borderRadius: Math.max(4, Math.round(size * 0.22)), objectFit: "contain", display: "block" }}
    />
  );
}

function SocialLinksEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (nextValue: string[]) => void;
}) {
  const updateLink = (index: number, nextValue: string) => {
    onChange(value.map((item, itemIndex) => (itemIndex === index ? nextValue : item)));
  };

  const removeLink = (index: number) => {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div style={{ display: "grid", gap: 9 }}>
      {value.map((link, index) => (
        <div
          key={index}
          style={{
            display: "grid",
            gridTemplateColumns: "38px minmax(0, 1fr) 38px",
            gap: 8,
            alignItems: "center",
          }}
        >
          <span
            title={link ? getSocialLinkLabel(link) : "Social link"}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              color: "var(--primary)",
              background: "var(--primary-soft)",
            }}
          >
            <SocialLinkLogo url={link} size={20} />
          </span>
          <input
            value={link}
            onChange={(event) => updateLink(index, event.target.value)}
            placeholder="https://instagram.com/username"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="button"
            aria-label={`Remove social link ${index + 1}`}
            title="Remove link"
            onClick={() => removeLink(index)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface-solid)",
              color: "var(--muted)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 17, height: 17, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" }}>
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
      ))}

      <button
        type="button"
        className="profile-cancel-btn"
        onClick={() => onChange([...value, ""])}
        style={{ justifySelf: "start" }}
      >
        + Add another link
      </button>
      <small>Gupto shows the website/platform favicon automatically when it is available.</small>
    </div>
  );
}

function WorkplacesEditor({
  value,
  onChange,
}: {
  value: ProfileWorkplace[];
  onChange: (nextValue: ProfileWorkplace[]) => void;
}) {
  const updateWorkplace = (index: number, patch: Partial<ProfileWorkplace>) => {
    onChange(value.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  const removeWorkplace = (index: number) => {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {value.map((workplace, index) => (
        <div
          key={index}
          style={{
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 10,
            background: "var(--surface-soft)",
            display: "grid",
            gridTemplateColumns: "38px minmax(0, 0.9fr) minmax(0, 1.25fr) 38px",
            gap: 8,
            alignItems: "center",
          }}
        >
          <span
            title={workplace.url ? getSocialLinkLabel(workplace.url) : "Workplace"}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              color: "var(--primary)",
              background: "var(--primary-soft)",
            }}
          >
            <SocialLinkLogo url={workplace.url} size={20} />
          </span>
          <input
            value={workplace.name}
            onChange={(event) => updateWorkplace(index, { name: event.target.value })}
            placeholder="Name (optional)"
            maxLength={120}
          />
          <input
            value={workplace.url}
            onChange={(event) => updateWorkplace(index, { url: event.target.value })}
            placeholder="Link (optional)"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={500}
          />
          <button
            type="button"
            aria-label={`Remove workplace ${index + 1}`}
            title="Remove workplace"
            onClick={() => removeWorkplace(index)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface-solid)",
              color: "var(--muted)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 17, height: 17, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" }}>
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
      ))}

      <button
        type="button"
        className="profile-cancel-btn"
        onClick={() => onChange([...value, { name: "", url: "" }])}
        style={{ justifySelf: "start" }}
      >
        + Add workplace
      </button>
    </div>
  );
}

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameCalendarDay(a: Date | null, b: Date) {
  return Boolean(
    a &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate(),
  );
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function AppleBirthDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const minDate = useMemo(() => new Date(1900, 0, 1), []);
  const maxDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"days" | "months" | "years">("days");
  const [viewDate, setViewDate] = useState(() => monthStart(selectedDate || maxDate));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const selectedYearRef = useRef<HTMLButtonElement>(null);
  const position = useAnchoredPopover(open, triggerRef, 324, 376);

  useEffect(() => {
    if (open) {
      setViewDate(monthStart(selectedDate || maxDate));
      setMode("days");
    }
  }, [open, selectedDate, maxDate]);

  useEffect(() => {
    if (mode === "years") {
      requestAnimationFrame(() => {
        selectedYearRef.current?.scrollIntoView({ block: "center" });
      });
    }
  }, [mode]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const node = event.target as Node;
      if (triggerRef.current?.contains(node) || popoverRef.current?.contains(node)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long" });
  const yearLabel = viewDate.getFullYear();
  const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOffset = new Date(year, month, 1).getDay();
    const start = new Date(year, month, 1 - firstDayOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      const outsideMonth = date.getMonth() !== month;
      const disabled = date < minDate || date > maxDate;
      return { date, outsideMonth, disabled };
    });
  }, [viewDate, minDate, maxDate]);

  const canGoPrevious =
    new Date(viewDate.getFullYear(), viewDate.getMonth(), 1) >
    new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const canGoNext =
    new Date(viewDate.getFullYear(), viewDate.getMonth(), 1) <
    new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  const previous = () => {
    if (mode === "days") {
      if (canGoPrevious) setViewDate((current) => addMonths(current, -1));
      return;
    }

    setViewDate((current) => {
      const nextYear = Math.max(1900, current.getFullYear() - 1);
      return new Date(nextYear, current.getMonth(), 1);
    });
  };

  const next = () => {
    if (mode === "days") {
      if (canGoNext) setViewDate((current) => addMonths(current, 1));
      return;
    }

    setViewDate((current) => {
      const nextYear = Math.min(maxDate.getFullYear(), current.getFullYear() + 1);
      return new Date(nextYear, current.getMonth(), 1);
    });
  };

  const years = useMemo(
    () => Array.from({ length: maxDate.getFullYear() - 1900 + 1 }, (_, index) => 1900 + index),
    [maxDate],
  );

  const popover =
    open && position && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            className="apple-popover apple-calendar-popover"
            data-placement={position.placement}
            style={{ top: position.top, left: position.left, width: position.width }}
            role="dialog"
            aria-label="Choose birth date"
          >
            <div className="apple-calendar-header">
              <button
                type="button"
                className="apple-calendar-nav"
                aria-label={mode === "days" ? "Previous month" : "Previous year"}
                onClick={previous}
                disabled={mode === "days" ? !canGoPrevious : yearLabel <= 1900}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12.5 4.5-5 5.5 5 5.5" /></svg>
              </button>

              <div className="apple-calendar-title">
                <button
                  type="button"
                  className={mode === "months" ? "active" : ""}
                  onClick={() => setMode((current) => (current === "months" ? "days" : "months"))}
                >
                  {monthLabel}
                </button>
                <button
                  type="button"
                  className={mode === "years" ? "active" : ""}
                  onClick={() => setMode((current) => (current === "years" ? "days" : "years"))}
                >
                  {yearLabel}
                </button>
              </div>

              <button
                type="button"
                className="apple-calendar-nav"
                aria-label={mode === "days" ? "Next month" : "Next year"}
                onClick={next}
                disabled={mode === "days" ? !canGoNext : yearLabel >= maxDate.getFullYear()}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7.5 4.5 5 5.5-5 5.5" /></svg>
              </button>
            </div>

            <div className="apple-calendar-stage" key={`${mode}-${viewDate.getFullYear()}-${viewDate.getMonth()}`}>
              {mode === "days" ? (
                <>
                  <div className="apple-calendar-weekdays" aria-hidden="true">
                    {weekdayLabels.map((day) => <span key={day}>{day}</span>)}
                  </div>
                  <div className="apple-calendar-grid">
                    {calendarCells.map(({ date, outsideMonth, disabled }) => {
                      const selected = sameCalendarDay(selectedDate, date);
                      const today = sameCalendarDay(maxDate, date);
                      return (
                        <button
                          key={formatIsoDate(date)}
                          type="button"
                          disabled={disabled}
                          className={[
                            outsideMonth ? "outside" : "",
                            selected ? "selected" : "",
                            today ? "today" : "",
                          ].filter(Boolean).join(" ")}
                          aria-label={date.toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                          aria-pressed={selected}
                          onClick={() => {
                            onChange(formatIsoDate(date));
                            setOpen(false);
                            triggerRef.current?.focus();
                          }}
                        >
                          <span>{date.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {mode === "months" ? (
                <div className="apple-calendar-month-grid">
                  {Array.from({ length: 12 }, (_, monthIndex) => {
                    const date = new Date(yearLabel, monthIndex, 1);
                    const afterMax =
                      date > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
                    const selected = monthIndex === viewDate.getMonth();
                    return (
                      <button
                        key={monthIndex}
                        type="button"
                        disabled={afterMax}
                        className={selected ? "selected" : ""}
                        onClick={() => {
                          setViewDate(new Date(yearLabel, monthIndex, 1));
                          setMode("days");
                        }}
                      >
                        {date.toLocaleDateString("en-US", { month: "short" })}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {mode === "years" ? (
                <div className="apple-calendar-year-grid">
                  {years.map((year) => {
                    const selected = year === yearLabel;
                    return (
                      <button
                        key={year}
                        ref={selected ? selectedYearRef : undefined}
                        type="button"
                        className={selected ? "selected" : ""}
                        onClick={() => {
                          const month = Math.min(
                            viewDate.getMonth(),
                            year === maxDate.getFullYear() ? maxDate.getMonth() : 11,
                          );
                          setViewDate(new Date(year, month, 1));
                          setMode("days");
                        }}
                      >
                        {year}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="apple-calendar-footer">
              <button
                type="button"
                className="subtle"
                disabled={!value}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="today"
                onClick={() => {
                  onChange(formatIsoDate(maxDate));
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                Today
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`apple-field-trigger apple-date-trigger${open ? " open" : ""}${value ? " has-value" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{value || "yyyy-mm-dd"}</span>
        <svg className="apple-calendar-trigger-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3v3M17 3v3M4.5 9h15M6.5 5h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
        </svg>
      </button>
      {popover}
    </>
  );
}

export default function ProfileView({
  currentUser,
  posts,
  bookmarks,
  onToggleTheme,
  onToggleLike,
  onToggleBookmark,
  onProfileUpdated,
  onShowToast,
}: ProfileViewProps) {
  const [tab, setTab] = useState<"posts" | "about">("posts");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [aboutField, setAboutField] = useState<AboutField | null>(null);
  const [aboutValue, setAboutValue] = useState("");
  const [aboutListValue, setAboutListValue] = useState<string[]>([]);
  const [aboutWorkplacesValue, setAboutWorkplacesValue] = useState<ProfileWorkplace[]>([]);
  const [aboutSaving, setAboutSaving] = useState(false);
  const [aboutError, setAboutError] = useState("");
  const [aboutDeleteField, setAboutDeleteField] = useState<AboutField | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [avatarAdjustOpen, setAvatarAdjustOpen] = useState(false);
  const [avatarAdjustment, setAvatarAdjustment] = useState<AvatarAdjustment>(DEFAULT_AVATAR_ADJUSTMENT);
  const [avatarNaturalSize, setAvatarNaturalSize] = useState<ImageNaturalSize>({ width: 0, height: 0 });
  const avatarDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: AvatarAdjustment;
  } | null>(null);
  const [removeProfilePhoto, setRemoveProfilePhoto] = useState(false);
  const [removeCoverPhoto, setRemoveCoverPhoto] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<DraftProfile>(() => ({
    name: currentUser.name,
    username: currentUser.username,
    bio: currentUser.bio,
    location: currentUser.location,
    hometown: currentUser.hometown,
    school: currentUser.school,
    college: currentUser.college,
    university: currentUser.university,
    relationshipStatus: currentUser.relationshipStatus,
    gender: currentUser.gender || "",
    workplaces: [...(currentUser.workplaces || [])],
    interests: [...(currentUser.interests || [])],
    socialLinks: [...(currentUser.socialLinks || [])],
    aboutEmail: currentUser.aboutEmailVisible ? currentUser.aboutEmail || currentUser.email : "",
    phoneNumber: currentUser.phoneNumber,
    website: currentUser.website,
    avatarTheme: currentUser.avatarTheme,
    birthDate: currentUser.birthDate,
    category: currentUser.category,
  }));

  const aboutEmail = currentUser.aboutEmailVisible
    ? currentUser.aboutEmail || currentUser.email
    : "";

  const getAboutValue = (field: AboutField): string => {
    if (field === "email") return currentUser.aboutEmail || currentUser.email;
    if (field === "workplace" || field === "interests" || field === "socialLinks") return "";

    const values: Record<Exclude<AboutField, "email" | "workplace" | "interests" | "socialLinks">, string> = {
      bio: currentUser.bio,
      location: currentUser.location,
      hometown: currentUser.hometown,
      school: currentUser.school,
      college: currentUser.college,
      university: currentUser.university,
      relationshipStatus: currentUser.relationshipStatus,
      gender: currentUser.gender,
      website: currentUser.website,
      category: currentUser.category,
      birthDate: currentUser.birthDate,
      phoneNumber: currentUser.phoneNumber,
    };

    return values[field] || "";
  };

  const getAboutListValue = (field: AboutField): string[] => {
    if (field === "interests") return [...(currentUser.interests || [])];
    if (field === "socialLinks") return [...(currentUser.socialLinks || [])];
    return [];
  };

  const hasAboutValue = (field: AboutField) => {
    if (field === "email") return currentUser.aboutEmailVisible;
    if (field === "workplace") return Boolean(currentUser.workplaces?.length);
    if (field === "interests") return Boolean(currentUser.interests?.length);
    if (field === "socialLinks") return Boolean(currentUser.socialLinks?.length);
    return Boolean(getAboutValue(field));
  };

  const openAboutEditor = (field: AboutField) => {
    setAboutField(field);
    setAboutValue(getAboutValue(field));
    setAboutListValue(getAboutListValue(field));
    setAboutWorkplacesValue(field === "workplace" ? [...(currentUser.workplaces || [])] : []);
    setAboutError("");
  };

  const closeAboutEditor = () => {
    if (aboutSaving) return;
    setAboutField(null);
    setAboutValue("");
    setAboutListValue([]);
    setAboutWorkplacesValue([]);
    setAboutError("");
  };

  const saveAboutField = async () => {
    if (!aboutField || aboutSaving) return;

    setAboutSaving(true);
    setAboutError("");

    const nextValue = aboutField === "workplace"
      ? aboutWorkplacesValue
      : aboutField === "interests" || aboutField === "socialLinks"
        ? aboutListValue
        : aboutValue;

    try {
      const response = await fetch("/api/profile/about", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: aboutField, value: nextValue }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { user?: CurrentUser; error?: string }
        | null;

      if (!response.ok || !payload?.user) {
        setAboutError(payload?.error || "Could not update this About field.");
        return;
      }

      onProfileUpdated(payload.user);
      onShowToast(`${ABOUT_FIELD_LABELS[aboutField]} updated`);
      setAboutField(null);
      setAboutValue("");
      setAboutListValue([]);
      setAboutWorkplacesValue([]);
    } catch {
      setAboutError("Could not update this About field.");
    } finally {
      setAboutSaving(false);
    }
  };

  const openAboutDelete = (field: AboutField) => {
    if (!hasAboutValue(field)) return;
    setAboutDeleteField(field);
    setAboutError("");
  };

  const deleteAboutField = async () => {
    if (!aboutDeleteField || aboutSaving) return;

    const field = aboutDeleteField;
    setAboutSaving(true);
    setAboutError("");

    try {
      const response = await fetch("/api/profile/about", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { user?: CurrentUser; error?: string }
        | null;

      if (!response.ok || !payload?.user) {
        setAboutError(payload?.error || "Could not delete this About field.");
        return;
      }

      onProfileUpdated(payload.user);
      onShowToast(`${ABOUT_FIELD_LABELS[field]} removed`);
      setAboutDeleteField(null);
    } catch {
      setAboutError("Could not delete this About field.");
    } finally {
      setAboutSaving(false);
    }
  };

  const completion = useMemo(() => {
    const checks = [
      Boolean(currentUser.name),
      Boolean(currentUser.username),
      Boolean(currentUser.image),
      Boolean(currentUser.coverImage),
      Boolean(currentUser.bio),
      Boolean(currentUser.location),
      Boolean(currentUser.website),
      Boolean(currentUser.category),
      Boolean(currentUser.birthDate),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [currentUser]);

  const releasePreview = (kind: "profile" | "cover") => {
    if (kind === "profile") {
      setProfilePreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return "";
      });
    } else {
      setCoverPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return "";
      });
    }
  };

  const resetMediaDraft = () => {
    releasePreview("profile");
    releasePreview("cover");
    setProfileFile(null);
    setCoverFile(null);
    setAvatarAdjustOpen(false);
    setAvatarAdjustment(DEFAULT_AVATAR_ADJUSTMENT);
    setAvatarNaturalSize({ width: 0, height: 0 });
    avatarDragRef.current = null;
    setRemoveProfilePhoto(false);
    setRemoveCoverPhoto(false);
  };

  const closeEditor = () => {
    if (saving) return;
    resetMediaDraft();
    setEditing(false);
  };

  const openEditor = () => {
    setDraft({
      name: currentUser.name,
      username: currentUser.username,
      bio: currentUser.bio,
      location: currentUser.location,
      hometown: currentUser.hometown,
      school: currentUser.school,
      college: currentUser.college,
      university: currentUser.university,
      relationshipStatus: currentUser.relationshipStatus,
      gender: currentUser.gender || "",
      workplaces: [...(currentUser.workplaces || [])],
      interests: [...(currentUser.interests || [])],
      socialLinks: [...(currentUser.socialLinks || [])],
      aboutEmail: currentUser.aboutEmailVisible ? currentUser.aboutEmail || currentUser.email : "",
      phoneNumber: currentUser.phoneNumber,
      website: currentUser.website,
      avatarTheme: currentUser.avatarTheme,
      birthDate: currentUser.birthDate,
      category: currentUser.category,
    });
    resetMediaDraft();
    setFormError("");
    setEditing(true);
  };

  const chooseMedia = (kind: "profile" | "cover", file: File | null) => {
    if (!file) return;

    if (file.size > MAX_MEDIA_BYTES) {
      setFormError("That file is too large. Choose one under 100 MB.");
      return;
    }

    const preview = buildPreviewUrl(file);
    setFormError("");

    if (kind === "profile") {
      releasePreview("profile");
      setProfileFile(file);
      setProfilePreview(preview);
      setAvatarAdjustment(DEFAULT_AVATAR_ADJUSTMENT);
      setAvatarNaturalSize({ width: 0, height: 0 });
      setAvatarAdjustOpen(Boolean(preview && adjustableProfileTypes.has(file.type.toLowerCase())));
      setRemoveProfilePhoto(false);
    } else {
      releasePreview("cover");
      setCoverFile(file);
      setCoverPreview(preview);
      setRemoveCoverPhoto(false);
    }
  };

  const removeMedia = (kind: "profile" | "cover") => {
    setFormError("");

    if (kind === "profile") {
      releasePreview("profile");
      setProfileFile(null);
      setAvatarAdjustOpen(false);
      setAvatarAdjustment(DEFAULT_AVATAR_ADJUSTMENT);
      setAvatarNaturalSize({ width: 0, height: 0 });
      avatarDragRef.current = null;
      setRemoveProfilePhoto(Boolean(currentUser.image));
    } else {
      releasePreview("cover");
      setCoverFile(null);
      setRemoveCoverPhoto(Boolean(currentUser.coverImage));
    }
  };

  const saveProfile = async () => {
    if (saving) return;
    setSaving(true);
    setFormError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const payload = (await response.json().catch(() => null)) as
        | { user?: CurrentUser; error?: string }
        | null;

      if (!response.ok || !payload?.user) {
        setFormError(payload?.error || "Could not save your profile.");
        return;
      }

      let nextUser = payload.user;
      const mediaChanged = Boolean(profileFile || coverFile || removeProfilePhoto || removeCoverPhoto);

      if (mediaChanged) {
        const mediaForm = new FormData();
        if (profileFile) {
          let profileUpload = profileFile;

          if (
            profilePreview &&
            adjustableProfileTypes.has(profileFile.type.toLowerCase()) &&
            avatarAdjustmentChanged(avatarAdjustment)
          ) {
            profileUpload = await createAdjustedProfileFile(
              profileFile,
              profilePreview,
              avatarNaturalSize,
              avatarAdjustment,
            );
          }

          mediaForm.append("profile", profileUpload);
        }
        if (coverFile) mediaForm.append("cover", coverFile);
        if (removeProfilePhoto) mediaForm.append("removeProfile", "1");
        if (removeCoverPhoto) mediaForm.append("removeCover", "1");

        const mediaResponse = await fetch("/api/profile/media", {
          method: "POST",
          body: mediaForm,
        });
        const mediaPayload = (await mediaResponse.json().catch(() => null)) as
          | { image?: string | null; coverImage?: string | null; error?: string }
          | null;

        if (!mediaResponse.ok || !mediaPayload) {
          onProfileUpdated(nextUser);
          setFormError(mediaPayload?.error || "Profile details were saved, but the photo could not be updated.");
          return;
        }

        nextUser = {
          ...nextUser,
          image: mediaPayload.image ?? null,
          coverImage: mediaPayload.coverImage ?? null,
        };
      }

      onProfileUpdated(nextUser);
      resetMediaDraft();
      setEditing(false);
      onShowToast(mediaChanged ? "Profile and photos updated" : "Profile updated");
    } catch {
      setFormError("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const profileDisplayUrl = profilePreview || (!removeProfilePhoto ? currentUser.image || "" : "");
  const coverDisplayUrl = coverPreview || (!removeCoverPhoto ? currentUser.coverImage || "" : "");
  const profileNeedsConversionPreview = Boolean(profileFile && !profilePreview);
  const coverNeedsConversionPreview = Boolean(coverFile && !coverPreview);
  const profileIsAdjustable = Boolean(
    profileFile &&
    profilePreview &&
    adjustableProfileTypes.has(profileFile.type.toLowerCase()),
  );
  const avatarGeometry = getAvatarGeometry(avatarNaturalSize, avatarAdjustment);

  const updateAvatarAdjustment = (next: AvatarAdjustment) => {
    setAvatarAdjustment(clampAvatarAdjustment(next, avatarNaturalSize));
  };

  const nudgeAvatar = (x: number, y: number) => {
    setAvatarAdjustment((current) =>
      clampAvatarAdjustment(
        {
          ...current,
          x: current.x + x,
          y: current.y + y,
        },
        avatarNaturalSize,
      ),
    );
  };

  const zoomAvatar = (delta: number) => {
    setAvatarAdjustment((current) =>
      clampAvatarAdjustment(
        {
          ...current,
          zoom: current.zoom + delta,
        },
        avatarNaturalSize,
      ),
    );
  };

  return (
    <main className="feed profile-page" id="profile">
      <section className="feed-topbar profile-topbar">
        <div>
          <span className="eyebrow">YOUR PROFILE</span>
          <h1>Your space, your story.</h1>
        </div>
        <div className="desktop-actions">
          <ThemeToggle onToggle={onToggleTheme} />
          <button className="icon-btn notification-btn" aria-label="Notifications" title="Notifications">
            <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
            <span className="notification-ping"></span>
          </button>
        </div>
      </section>

      <section className="profile-hero card">
        <div className={`profile-cover${currentUser.coverImage ? " has-photo" : ""}`} aria-label={currentUser.coverImage ? "Cover photo" : undefined}>
          {currentUser.coverImage ? (
            <>
              <img className="profile-cover-photo-bg" src={currentUser.coverImage} alt="" aria-hidden="true" />
              <img className="profile-cover-photo-main" src={currentUser.coverImage} alt="" />
            </>
          ) : (
            <><span></span><span></span><span></span></>
          )}
        </div>
        <div className="profile-hero-body">
          <div className="profile-identity-row">
            <UserAvatar
              initials={currentUser.initials}
              image={currentUser.image}
              theme={currentUser.avatarTheme}
              className="profile-avatar profile-avatar-xl"
              alt={`${currentUser.name} avatar`}
            />
            <button className="profile-edit-btn" type="button" onClick={openEditor}>
              <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z"/></svg>
              Edit profile
            </button>
          </div>

          <div className="profile-title-block">
            <h2>{currentUser.name}</h2>
            <div className="profile-username-category-row">
              <span className="profile-username">@{currentUser.username}</span>
              {currentUser.category ? (
                <>
                  <span className="profile-category-separator" aria-hidden="true">|</span>
                  <span className="profile-category-inline">
                    <ProfileCategoryIcon category={currentUser.category} />
                    <span>{getProfileCategoryLabel(currentUser.category)}</span>
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <p className={`profile-bio${currentUser.bio ? "" : " empty"}`}>
            {currentUser.bio || "Add a short bio so people know a little about you."}
          </p>

          <div className="profile-meta-line">
            {currentUser.location ? (
              <span><svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>{currentUser.location}</span>
            ) : null}
            {currentUser.website ? (
              <a href={currentUser.website} target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>
                {currentUser.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            ) : null}
            <span><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>Joined {compactJoined(currentUser.joinedAt)}</span>
          </div>

          <div className="profile-stats" aria-label="Profile statistics">
            <div><strong>{currentUser.postCount}</strong><span>Posts</span></div>
            <div><strong>{completion}%</strong><span>Complete</span></div>
            <div><strong>{monthYear(currentUser.joinedAt)}</strong><span>Member since</span></div>
          </div>
        </div>
      </section>

      <section className="profile-tabs" aria-label="Profile sections">
        <button className={tab === "posts" ? "active" : ""} type="button" onClick={() => setTab("posts")}>Posts</button>
        <button className={tab === "about" ? "active" : ""} type="button" onClick={() => setTab("about")}>About</button>
        <span></span>
      </section>

      {tab === "posts" ? (
        <section className="posts profile-posts">
          {posts.length ? posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              bookmarked={bookmarks.has(post.id)}
              onToggleLike={onToggleLike}
              onToggleBookmark={onToggleBookmark}
            />
          )) : (
            <div className="profile-empty card">
              <span>✦</span>
              <h3>No posts yet</h3>
              <p>Your posts will appear here after you publish them.</p>
            </div>
          )}
        </section>
      ) : (
        currentUser.bio ||
        currentUser.gender ||
        currentUser.category ||
        currentUser.workplaces?.length ||
        currentUser.location ||
        currentUser.hometown ||
        currentUser.school ||
        currentUser.college ||
        currentUser.university ||
        currentUser.relationshipStatus ||
        currentUser.interests?.length ||
        currentUser.socialLinks?.length ||
        currentUser.website ||
        currentUser.birthDate ||
        currentUser.aboutEmailVisible ||
        currentUser.phoneNumber ? (
          <section className="profile-about card">
            {currentUser.bio ? (
              <div className="profile-about-row">
                <span className="profile-about-icon"><AboutFieldIcon field="bio" /></span>
                <div className="profile-about-copy"><small>Bio</small><strong>{currentUser.bio}</strong></div>
                <AboutRowActions field="bio" canDelete onEdit={openAboutEditor} onDelete={openAboutDelete} />
              </div>
            ) : null}
            {currentUser.gender ? (
              <div className="profile-about-row">
                <span className="profile-about-icon"><AboutFieldIcon field="gender" /></span>
                <div className="profile-about-copy"><small>Gender</small><strong>{getProfileGenderLabel(currentUser.gender)}</strong></div>
                <AboutRowActions field="gender" canDelete onEdit={openAboutEditor} onDelete={openAboutDelete} />
              </div>
            ) : null}
            {currentUser.category ? (
              <div className="profile-about-row">
                <span className="profile-about-icon"><AboutFieldIcon field="category" /></span>
                <div className="profile-about-copy"><small>Category</small><strong>{getProfileCategoryLabel(currentUser.category)}</strong></div>
                <AboutRowActions field="category" canDelete onEdit={openAboutEditor} onDelete={openAboutDelete} />
              </div>
            ) : null}
            {currentUser.workplaces?.length ? (
              <div className="profile-about-row">
                <span className="profile-about-icon"><AboutFieldIcon field="workplace" /></span>
                <div className="profile-about-copy">
                  <small>Workplace</small>
                  <strong style={{ display: "flex", flexWrap: "wrap", gap: "5px 12px", marginTop: 2 }}>
                    {currentUser.workplaces.map((workplace, index) => workplace.url ? (
                      <a
                        key={`${workplace.name}|${workplace.url}|${index}`}
                        href={workplace.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        title={workplace.url}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "inherit", textDecoration: "none", font: "inherit", lineHeight: "inherit" }}
                      >
                        <SocialLinkLogo url={workplace.url} size={16} />
                        <span>{workplace.name || getSocialLinkLabel(workplace.url)}</span>
                      </a>
                    ) : (
                      <span key={`${workplace.name}|${index}`}>{workplace.name}</span>
                    ))}
                  </strong>
                </div>
                <AboutRowActions field="workplace" canDelete onEdit={openAboutEditor} onDelete={openAboutDelete} />
              </div>
            ) : null}
            {currentUser.location ? (
              <div className="profile-about-row">
                <span className="profile-about-icon"><AboutFieldIcon field="location" /></span>
                <div className="profile-about-copy"><small>Current location</small><strong>{currentUser.location}</strong></div>
                <AboutRowActions field="location" canDelete onEdit={openAboutEditor} onDelete={openAboutDelete} />
              </div>
            ) : null}
            {currentUser.hometown ? (
              <div className="profile-about-row">
                <span className="profile-about-icon"><AboutFieldIcon field="hometown" /></span>
                <div className="profile-about-copy"><small>Hometown</small><strong>{currentUser.hometown}</strong></div>
                <AboutRowActions field="hometown" canDelete onEdit={openAboutEditor} onDelete={openAboutDelete} />
              </div>
            ) : null}
            {currentUser.school ? (
              <div className="profile-about-row">
                <span className="profile-about-icon"><AboutFieldIcon field="school" /></span>
                <div className="profile-about-copy"><small>School</small><strong>{currentUser.school}</strong></div>
                <AboutRowActions field="school" canDelete onEdit={openAboutEditor} onDelete={openAboutDelete} />
              </div>
            ) : null}
            {currentUser.college ? (
              <div className="profile-about-row">
                <span className="profile-about-icon"><AboutFieldIcon field="college" /></span>
                <div className="profile-about-copy"><small>College</small><strong>{currentUser.college}</strong></div>
                <AboutRowActions field="college" canDelete onEdit={openAboutEditor} onDelete={openAboutDelete} />
              </div>
            ) : null}
            {currentUser.university ? (
              <div className="profile-about-row">
                <span className="profile-about-icon"><AboutFieldIcon field="university" /></span>
                <div className="profile-about-copy"><small>University</small><strong>{currentUser.university}</strong></div>
                <AboutRowActions field="university" canDelete onEdit={openAboutEditor} onDelete={openAboutDelete} />
              </div>
            ) : null}
            {currentUser.relationshipStatus ? (
              <div className="profile-about-row">
                <span className="profile-about-icon"><AboutFieldIcon field="relationshipStatus" /></span>
                <div className="profile-about-copy"><small>Relationship status</small><strong>{getRelationshipStatusLabel(currentUser.relationshipStatus)}</strong></div>
                <AboutRowActions field="relationshipStatus" canDelete onEdit={openAboutEditor} onDelete={openAboutDelete} />
              </div>
            ) : null}
            {currentUser.interests?.length ? (
              <div className="profile-about-row">
                <span className="profile-about-icon"><AboutFieldIcon field="interests" /></span>
                <div className="profile-about-copy">
                  <small>Interests</small>
                  <strong>{currentUser.interests.map(getProfileInterestLabel).join(" · ")}</strong>
                </div>
                <AboutRowActions field="interests" canDelete onEdit={openAboutEditor} onDelete={openAboutDelete} />
              </div>
            ) : null}
            {currentUser.socialLinks?.length ? (
              <div className="profile-about-row">
                <span className="profile-about-icon"><AboutFieldIcon field="socialLinks" /></span>
                <div className="profile-about-copy">
                  <small>Social links</small>
                  <strong style={{ display: "flex", flexWrap: "wrap", gap: "5px 12px", marginTop: 2 }}>
                    {currentUser.socialLinks.map((link) => (
                      <a
                        key={link}
                        href={link}
                        target="_blank"
                        rel="noreferrer noopener"
                        title={link}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "inherit", textDecoration: "none", font: "inherit", lineHeight: "inherit" }}
                      >
                        <SocialLinkLogo url={link} size={16} />
                        <span>{getSocialLinkLabel(link)}</span>
                      </a>
                    ))}
                  </strong>
                </div>
                <AboutRowActions field="socialLinks" canDelete onEdit={openAboutEditor} onDelete={openAboutDelete} />
              </div>
            ) : null}
            {currentUser.website ? (
              <div className="profile-about-row">
                <span className="profile-about-icon"><AboutFieldIcon field="website" /></span>
                <div className="profile-about-copy">
                  <small>Website</small>
                  <strong>
                    <a
                      href={currentUser.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      title={currentUser.website}
                      style={{ color: "inherit", textDecoration: "none", font: "inherit", lineHeight: "inherit" }}
                    >
                      {currentUser.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  </strong>
                </div>
                <AboutRowActions field="website" canDelete onEdit={openAboutEditor} onDelete={openAboutDelete} />
              </div>
            ) : null}
            {currentUser.birthDate ? (
              <div className="profile-about-row private-row">
                <span className="profile-about-icon" style={{ color: "var(--primary)", background: "var(--primary-soft)" }}><AboutFieldIcon field="birthDate" /></span>
                <div className="profile-about-copy"><small>Birth date · only you can see this</small><strong>{formatBirthDate(currentUser.birthDate)}</strong></div>
                <AboutRowActions field="birthDate" canDelete onEdit={openAboutEditor} onDelete={openAboutDelete} />
              </div>
            ) : null}
            {currentUser.aboutEmailVisible && aboutEmail ? (
              <div className="profile-about-row private-row">
                <span className="profile-about-icon" style={{ color: "var(--primary)", background: "var(--primary-soft)" }}><AboutFieldIcon field="email" /></span>
                <div className="profile-about-copy"><small>Email · only you can see this</small><strong>{aboutEmail}</strong></div>
                <AboutRowActions field="email" canDelete onEdit={openAboutEditor} onDelete={openAboutDelete} />
              </div>
            ) : null}
            {currentUser.phoneNumber ? (
              <div className="profile-about-row private-row">
                <span className="profile-about-icon" style={{ color: "var(--primary)", background: "var(--primary-soft)" }}><AboutFieldIcon field="phoneNumber" /></span>
                <div className="profile-about-copy"><small>Phone number · only you can see this</small><strong>{currentUser.phoneNumber}</strong></div>
                <AboutRowActions field="phoneNumber" canDelete onEdit={openAboutEditor} onDelete={openAboutDelete} />
              </div>
            ) : null}
          </section>
        ) : null

      )}

      {aboutField ? (
        <div className="profile-modal-backdrop about-field-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeAboutEditor();
        }}>
          <section className="profile-modal about-field-modal card" role="dialog" aria-modal="true" aria-labelledby="about-field-title">
            <header className="profile-modal-header">
              <div>
                <span className="eyebrow">ABOUT</span>
                <h2 id="about-field-title">Edit {ABOUT_FIELD_LABELS[aboutField]}</h2>
              </div>
              <button className="profile-modal-close" type="button" aria-label="Close" onClick={closeAboutEditor}>×</button>
            </header>

            <div className="about-field-editor-body">
              {aboutField === "bio" ? (
                <label className="profile-field">
                  <span>Bio <em>{aboutValue.length}/160</em></span>
                  <textarea maxLength={160} rows={4} value={aboutValue} onChange={(event) => setAboutValue(event.target.value)} placeholder="A few words about you…" autoFocus />
                </label>
              ) : null}

              {aboutField === "location" ? (
                <label className="profile-field">
                  <span>Current location</span>
                  <input maxLength={80} value={aboutValue} onChange={(event) => setAboutValue(event.target.value)} placeholder="City, Country" autoFocus />
                </label>
              ) : null}

              {aboutField === "hometown" ? (
                <label className="profile-field">
                  <span>Hometown</span>
                  <input maxLength={80} value={aboutValue} onChange={(event) => setAboutValue(event.target.value)} placeholder="City, Country" autoFocus />
                </label>
              ) : null}

              {aboutField === "relationshipStatus" ? (
                <div className="profile-field">
                  <span>Relationship status</span>
                  <AppleRelationshipPicker value={aboutValue} onChange={setAboutValue} />
                </div>
              ) : null}

              {aboutField === "gender" ? (
                <div className="profile-field">
                  <span>Gender</span>
                  <AppleGenderPicker value={aboutValue} onChange={setAboutValue} />
                  <small>Optional. It appears in About only when you choose one.</small>
                </div>
              ) : null}

              {aboutField === "workplace" ? (
                <div className="profile-field profile-field-wide">
                  <span>Workplace</span>
                  <WorkplacesEditor value={aboutWorkplacesValue} onChange={setAboutWorkplacesValue} />
                </div>
              ) : null}

              {aboutField === "school" ? (
                <label className="profile-field">
                  <span>School</span>
                  <input maxLength={120} value={aboutValue} onChange={(event) => setAboutValue(event.target.value)} placeholder="Your school" autoFocus />
                </label>
              ) : null}

              {aboutField === "college" ? (
                <label className="profile-field">
                  <span>College</span>
                  <input maxLength={120} value={aboutValue} onChange={(event) => setAboutValue(event.target.value)} placeholder="Your college" autoFocus />
                </label>
              ) : null}

              {aboutField === "university" ? (
                <label className="profile-field">
                  <span>University</span>
                  <input maxLength={120} value={aboutValue} onChange={(event) => setAboutValue(event.target.value)} placeholder="Your university" autoFocus />
                </label>
              ) : null}

              {aboutField === "interests" ? (
                <div className="profile-field">
                  <span>Interests</span>
                  <AppleInterestsPicker value={aboutListValue} onChange={setAboutListValue} />
                  <small>Select as many interests as you want.</small>
                </div>
              ) : null}

              {aboutField === "socialLinks" ? (
                <div className="profile-field">
                  <span>Social links</span>
                  <SocialLinksEditor value={aboutListValue} onChange={setAboutListValue} />
                </div>
              ) : null}

              {aboutField === "website" ? (
                <label className="profile-field">
                  <span>Website</span>
                  <input maxLength={200} value={aboutValue} onChange={(event) => setAboutValue(event.target.value)} placeholder="yourwebsite.com" autoFocus />
                </label>
              ) : null}

              {aboutField === "category" ? (
                <div className="profile-field">
                  <span>Category</span>
                  <AppleCategoryPicker value={aboutValue} onChange={setAboutValue} />
                  <small>Choose the one that describes you best.</small>
                </div>
              ) : null}

              {aboutField === "birthDate" ? (
                <div className="profile-field">
                  <span>Birth date</span>
                  <AppleBirthDatePicker value={aboutValue} onChange={setAboutValue} />
                  <small>Kept private. Only you can see it here.</small>
                </div>
              ) : null}

              {aboutField === "email" ? (
                <label className="profile-field">
                  <span>Private About email</span>
                  <input type="email" maxLength={254} value={aboutValue} onChange={(event) => setAboutValue(event.target.value)} placeholder="you@example.com" autoFocus />
                  <small>This changes only the private email shown in About. Your sign-in email stays unchanged.</small>
                </label>
              ) : null}

              {aboutField === "phoneNumber" ? (
                <label className="profile-field">
                  <span>Phone number</span>
                  <input type="tel" inputMode="tel" maxLength={32} value={aboutValue} onChange={(event) => setAboutValue(event.target.value)} placeholder="+880 1XXX-XXXXXX" autoFocus />
                  <small>Kept private. Only you can see it in About.</small>
                </label>
              ) : null}
            </div>

            {aboutError ? <p className="profile-form-error" role="alert">{aboutError}</p> : null}

            <footer className="profile-modal-footer">
              <button className="profile-cancel-btn" type="button" disabled={aboutSaving} onClick={closeAboutEditor}>Cancel</button>
              <button className="profile-save-btn" type="button" disabled={aboutSaving} onClick={saveAboutField}>{aboutSaving ? "Saving…" : "Save"}</button>
            </footer>
          </section>
        </div>
      ) : null}

      {aboutDeleteField ? (
        <div className="profile-modal-backdrop about-field-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !aboutSaving) setAboutDeleteField(null);
        }}>
          <section className="profile-modal about-delete-modal card" role="dialog" aria-modal="true" aria-labelledby="about-delete-title">
            <div className="about-delete-symbol" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>
            </div>
            <div className="about-delete-copy">
              <span className="eyebrow">REMOVE FROM ABOUT</span>
              <h2 id="about-delete-title">Delete {ABOUT_FIELD_LABELS[aboutDeleteField]}?</h2>
              <p>
                {aboutDeleteField === "email"
                  ? "This removes the private email from About only. Your Gupto sign-in email will remain safe and unchanged."
                  : aboutDeleteField === "phoneNumber"
                    ? "This removes your private phone number from About and deletes it from your saved profile data."
                    : `This will remove your ${ABOUT_FIELD_LABELS[aboutDeleteField].toLowerCase()} from your saved profile.`}
              </p>
            </div>
            {aboutError ? <p className="profile-form-error" role="alert">{aboutError}</p> : null}
            <footer className="profile-modal-footer">
              <button className="profile-cancel-btn" type="button" disabled={aboutSaving} onClick={() => setAboutDeleteField(null)}>Cancel</button>
              <button className="about-delete-confirm" type="button" disabled={aboutSaving} onClick={deleteAboutField}>{aboutSaving ? "Deleting…" : "Delete"}</button>
            </footer>
          </section>
        </div>
      ) : null}

      {editing ? (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeEditor();
        }}>
          <section className="profile-modal card" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
            <header className="profile-modal-header">
              <div><span className="eyebrow">PROFILE</span><h2 id="edit-profile-title">Edit your profile</h2></div>
              <button className="profile-modal-close" type="button" aria-label="Close" onClick={closeEditor}>×</button>
            </header>

            <div className="profile-media-editor">
              <section className="profile-media-card profile-media-cover-card">
                <div className={`profile-media-cover-preview${coverDisplayUrl ? " has-photo" : ""}`}>
                  {coverDisplayUrl ? (
                    <>
                      <img className="profile-media-preview-bg" src={coverDisplayUrl} alt="" aria-hidden="true" />
                      <img className="profile-media-preview-main" src={coverDisplayUrl} alt="Cover preview" />
                    </>
                  ) : coverNeedsConversionPreview ? (
                    <div className="profile-media-file-ready"><b>✓</b><span>{coverFile?.name}</span><small>Ready to save exactly as uploaded</small></div>
                  ) : (
                    <div className="profile-media-empty-preview"><span>▧</span><small>Your cover photo</small></div>
                  )}
                </div>
                <div className="profile-media-copy">
                  <div><strong>Cover photo</strong><small>Saved in the same quality you upload.</small></div>
                  <div className="profile-media-buttons">
                    <button type="button" onClick={() => coverInputRef.current?.click()}>Choose photo</button>
                    {(coverFile || currentUser.coverImage) ? <button className="muted" type="button" onClick={() => removeMedia("cover")}>Remove</button> : null}
                  </div>
                </div>
                <input
                  ref={coverInputRef}
                  className="profile-media-file-input"
                  type="file"
                  onChange={(event) => {
                    chooseMedia("cover", event.currentTarget.files?.[0] || null);
                    event.currentTarget.value = "";
                  }}
                />
              </section>

              <section className="profile-media-card profile-media-avatar-card">
                <div className="profile-media-avatar-preview">
                  {profileDisplayUrl ? (
                    <>
                      <img className="profile-media-preview-bg" src={profileDisplayUrl} alt="" aria-hidden="true" />
                      <img className="profile-media-preview-main" src={profileDisplayUrl} alt="Profile preview" />
                    </>
                  ) : profileNeedsConversionPreview ? (
                    <div className="profile-media-file-ready compact"><b>✓</b><small>Ready</small></div>
                  ) : (
                    <UserAvatar initials={currentUser.initials} image={null} theme={draft.avatarTheme} className="profile-avatar profile-avatar-editor" />
                  )}
                </div>
                <div className="profile-media-copy">
                  <div><strong>Profile photo</strong><small>Saved in the same quality you upload.</small></div>
                  <div className="profile-media-buttons">
                    <button type="button" onClick={() => profileInputRef.current?.click()}>Choose photo</button>
                    {profileIsAdjustable ? (
                      <button
                        className="muted"
                        type="button"
                        aria-expanded={avatarAdjustOpen}
                        onClick={() => setAvatarAdjustOpen((current) => !current)}
                      >
                        Adjust
                      </button>
                    ) : null}
                    {(profileFile || currentUser.image) ? <button className="muted" type="button" onClick={() => removeMedia("profile")}>Remove</button> : null}
                  </div>
                </div>
                <input
                  ref={profileInputRef}
                  className="profile-media-file-input"
                  type="file"
                  onChange={(event) => {
                    chooseMedia("profile", event.currentTarget.files?.[0] || null);
                    event.currentTarget.value = "";
                  }}
                />
              </section>
            </div>

            {profileIsAdjustable && avatarAdjustOpen ? (
              <section className="profile-avatar-adjust-panel" aria-label="Adjust profile photo">
                <div className="profile-avatar-adjust-stage-wrap">
                  <div
                    className="profile-avatar-crop-stage"
                    role="application"
                    aria-label="Profile photo crop preview. Drag the photo to reposition it."
                    onPointerDown={(event) => {
                      if (!avatarNaturalSize.width || !avatarNaturalSize.height) return;
                      event.currentTarget.setPointerCapture(event.pointerId);
                      avatarDragRef.current = {
                        pointerId: event.pointerId,
                        startX: event.clientX,
                        startY: event.clientY,
                        origin: avatarAdjustment,
                      };
                    }}
                    onPointerMove={(event) => {
                      const drag = avatarDragRef.current;
                      if (!drag || drag.pointerId !== event.pointerId) return;

                      updateAvatarAdjustment({
                        ...drag.origin,
                        x: drag.origin.x + (event.clientX - drag.startX),
                        y: drag.origin.y + (event.clientY - drag.startY),
                      });
                    }}
                    onPointerUp={(event) => {
                      if (avatarDragRef.current?.pointerId === event.pointerId) {
                        avatarDragRef.current = null;
                      }
                    }}
                    onPointerCancel={(event) => {
                      if (avatarDragRef.current?.pointerId === event.pointerId) {
                        avatarDragRef.current = null;
                      }
                    }}
                  >
                    <img
                      className="profile-avatar-crop-image"
                      src={profilePreview}
                      alt="Adjustable profile preview"
                      draggable={false}
                      onLoad={(event) => {
                        const natural = {
                          width: event.currentTarget.naturalWidth,
                          height: event.currentTarget.naturalHeight,
                        };
                        setAvatarNaturalSize(natural);
                        setAvatarAdjustment((current) => clampAvatarAdjustment(current, natural));
                      }}
                      style={{
                        width: `${avatarGeometry.renderWidth}px`,
                        height: `${avatarGeometry.renderHeight}px`,
                        left: `${avatarGeometry.left}px`,
                        top: `${avatarGeometry.top}px`,
                      }}
                    />
                    <span className="profile-avatar-crop-guide" aria-hidden="true"></span>
                  </div>
                  <small>Drag the photo or use the controls for precise positioning.</small>
                </div>

                <div className="profile-avatar-adjust-controls">
                  <div className="profile-avatar-adjust-copy">
                    <div>
                      <span className="eyebrow">PHOTO POSITION</span>
                      <strong>Adjust profile photo</strong>
                    </div>
                    <span>{Math.round(avatarAdjustment.zoom * 100)}%</span>
                  </div>

                  <div className="profile-avatar-direction-pad" aria-label="Move profile photo">
                    <button type="button" aria-label="Move photo up" onClick={() => nudgeAvatar(0, -AVATAR_NUDGE)}>↑</button>
                    <button type="button" aria-label="Move photo left" onClick={() => nudgeAvatar(-AVATAR_NUDGE, 0)}>←</button>
                    <button className="reset" type="button" aria-label="Reset profile photo position" title="Reset" onClick={() => updateAvatarAdjustment(DEFAULT_AVATAR_ADJUSTMENT)}>
                      <svg className="profile-reset-icon" viewBox="0 0 512 512" aria-hidden="true">
                        <path d="M463.5 224H303.7c-21.4 0-32.1-25.9-17-41L336.9 133C293.1 89.2 221.5 87.5 176 133c-47.2 47.2-47.2 123.8 0 171s123.8 47.2 171 0c6.2-6.2 11.5-13 16-20.3 4.8-7.8 15.1-10.1 22.8-5.2l34.2 21.2c7.3 4.5 9.6 14 5.3 21.4-7.7 13.1-17.2 25.5-28.7 37-74.2 74.2-194.7 74.2-268.9 0s-74.2-194.7 0-268.9c72.6-72.6 189.5-74.2 264-4.7l56.2-56.2c15.1-15.1 41-4.4 41 17V192c0 17.7-14.3 32-32 32Z" />
                      </svg>
                    </button>
                    <button type="button" aria-label="Move photo right" onClick={() => nudgeAvatar(AVATAR_NUDGE, 0)}>→</button>
                    <button type="button" aria-label="Move photo down" onClick={() => nudgeAvatar(0, AVATAR_NUDGE)}>↓</button>
                  </div>

                  <div className="profile-avatar-zoom-row">
                    <button type="button" aria-label="Zoom out" onClick={() => zoomAvatar(-0.1)}>−</button>
                    <input
                      aria-label="Profile photo zoom"
                      type="range"
                      min={AVATAR_ZOOM_MIN}
                      max={AVATAR_ZOOM_MAX}
                      step="0.05"
                      value={avatarAdjustment.zoom}
                      onChange={(event) =>
                        updateAvatarAdjustment({
                          ...avatarAdjustment,
                          zoom: Number(event.target.value),
                        })
                      }
                    />
                    <button type="button" aria-label="Zoom in" onClick={() => zoomAvatar(0.1)}>+</button>
                  </div>

                  <p>
                    Top alignment stays the default. Gupto only creates an adjusted copy when you actually move or zoom the photo.
                  </p>
                </div>
              </section>
            ) : null}

            <div className="profile-form-grid">
              <label className="profile-field">
                <span>Name</span>
                <input maxLength={50} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
                <small>English letters and spaces only.</small>
              </label>

              <label className="profile-field">
                <span>Username</span>
                <div className="profile-username-input"><b>@</b><input maxLength={30} value={draft.username} onChange={(event) => setDraft((current) => ({ ...current, username: event.target.value.replace(/[^A-Za-z0-9_]/g, "").toLowerCase() }))} /></div>
                <small>Letters, numbers, and underscore.</small>
              </label>

              <label className="profile-field profile-field-wide">
                <span>Bio <em>{draft.bio.length}/160</em></span>
                <textarea maxLength={160} rows={3} value={draft.bio} onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))} placeholder="A few words about you…" />
              </label>

              <div className="profile-field">
                <span>Category</span>
                <AppleCategoryPicker
                  value={draft.category}
                  onChange={(category) => setDraft((current) => ({ ...current, category }))}
                />
                <small>Choose the one that describes you best.</small>
              </div>

              <div className="profile-field">
                <span>Birth date</span>
                <AppleBirthDatePicker
                  value={draft.birthDate}
                  onChange={(birthDate) => setDraft((current) => ({ ...current, birthDate }))}
                />
                <small>Kept private for now. Only you can see it here.</small>
              </div>

              <label className="profile-field">
                <span>Current location</span>
                <input maxLength={80} value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} placeholder="City, Country" />
              </label>

              <label className="profile-field">
                <span>Hometown</span>
                <input maxLength={80} value={draft.hometown} onChange={(event) => setDraft((current) => ({ ...current, hometown: event.target.value }))} placeholder="City, Country" />
              </label>

              <label className="profile-field">
                <span>Email</span>
                <input type="email" maxLength={254} value={draft.aboutEmail} onChange={(event) => setDraft((current) => ({ ...current, aboutEmail: event.target.value }))} placeholder="you@example.com" />
                <small>Private. Only you can see it in About. Your sign-in email stays unchanged.</small>
              </label>

              <label className="profile-field">
                <span>Phone number</span>
                <input type="tel" inputMode="tel" maxLength={32} value={draft.phoneNumber} onChange={(event) => setDraft((current) => ({ ...current, phoneNumber: event.target.value }))} placeholder="+880 1XXX-XXXXXX" />
                <small>Private. Only you can see it in About.</small>
              </label>

              <div className="profile-field">
                <span>Relationship status</span>
                <AppleRelationshipPicker
                  value={draft.relationshipStatus}
                  onChange={(relationshipStatus) => setDraft((current) => ({ ...current, relationshipStatus }))}
                />
                <small>Shown in About only when you choose one.</small>
              </div>

              <div className="profile-field">
                <span>Gender</span>
                <AppleGenderPicker
                  value={draft.gender}
                  onChange={(gender) => setDraft((current) => ({ ...current, gender }))}
                />
                <small>Optional. Shown in About only when you choose one.</small>
              </div>

              <div className="profile-field profile-field-wide">
                <span>Workplace</span>
                <WorkplacesEditor
                  value={draft.workplaces}
                  onChange={(workplaces) => setDraft((current) => ({ ...current, workplaces }))}
                />
              </div>

              <label className="profile-field">
                <span>School</span>
                <input maxLength={120} value={draft.school} onChange={(event) => setDraft((current) => ({ ...current, school: event.target.value }))} placeholder="Your school" />
              </label>

              <label className="profile-field">
                <span>College</span>
                <input maxLength={120} value={draft.college} onChange={(event) => setDraft((current) => ({ ...current, college: event.target.value }))} placeholder="Your college" />
              </label>

              <label className="profile-field">
                <span>University</span>
                <input maxLength={120} value={draft.university} onChange={(event) => setDraft((current) => ({ ...current, university: event.target.value }))} placeholder="Your university" />
              </label>

              <div className="profile-field profile-field-wide">
                <span>Interests</span>
                <AppleInterestsPicker
                  value={draft.interests}
                  onChange={(interests) => setDraft((current) => ({ ...current, interests }))}
                />
                <small>Choose one or multiple hobbies and interests.</small>
              </div>

              <div className="profile-field profile-field-wide">
                <span>Social links</span>
                <SocialLinksEditor
                  value={draft.socialLinks}
                  onChange={(socialLinks) => setDraft((current) => ({ ...current, socialLinks }))}
                />
              </div>

              <label className="profile-field profile-field-wide">
                <span>Website</span>
                <input maxLength={200} value={draft.website} onChange={(event) => setDraft((current) => ({ ...current, website: event.target.value }))} placeholder="yourwebsite.com" />
              </label>
            </div>

            {formError ? <p className="profile-form-error" role="alert">{formError}</p> : null}

            <footer className="profile-modal-footer">
              <button className="profile-cancel-btn" type="button" disabled={saving} onClick={closeEditor}>Cancel</button>
              <button className="profile-save-btn" type="button" disabled={saving} onClick={saveProfile}>{saving ? "Saving…" : "Save profile"}</button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}
