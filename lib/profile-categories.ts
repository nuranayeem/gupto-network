export const PROFILE_CATEGORIES = [
  { value: "student", label: "Student" },
  { value: "content-creator", label: "Content Creator" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "business-owner", label: "Business Owner" },
  { value: "professional", label: "Professional" },
  { value: "developer-tech", label: "Developer / Tech" },
  { value: "designer", label: "Designer" },
  { value: "writer", label: "Writer" },
  { value: "artist-musician", label: "Artist / Musician" },
  { value: "photographer", label: "Photographer" },
  { value: "teacher-educator", label: "Teacher / Educator" },
  { value: "gamer", label: "Gamer" },
  { value: "sports-fitness", label: "Sports / Fitness" },
  { value: "public-figure", label: "Public Figure" },
  { value: "travel-creator", label: "Travel Creator" },
  { value: "food-vlogger", label: "Food Vlogger" },
  { value: "restaurant-cafe", label: "Restaurant / Cafe" },
  { value: "chef-culinary", label: "Chef / Culinary" },
  { value: "outdoor-hiking", label: "Outdoor / Hiking" },
  { value: "lifestyle-creator", label: "Lifestyle Creator" },
  { value: "fashion", label: "Fashion" },
  { value: "beauty", label: "Beauty" },
  { value: "health-wellness", label: "Health / Wellness" },
  { value: "tech-gadgets", label: "Tech / Gadgets" },
  { value: "home-living", label: "Home / Living" },
  { value: "parenting-family", label: "Parenting / Family" },
  { value: "entertainment-events", label: "Entertainment / Events" },
  { value: "journalist-media", label: "Journalist / Media" },
  { value: "reviewer-critic", label: "Reviewer / Critic" },
  { value: "other", label: "Other" },
] as const;

export type ProfileCategory = (typeof PROFILE_CATEGORIES)[number]["value"];

export function isProfileCategory(value: string) {
  if (value === "fashion-beauty") {
    return true;
  }

  return PROFILE_CATEGORIES.some((category) => category.value === value);
}

export function getProfileCategoryLabel(value: string) {
  if (value === "fashion-beauty") {
    return "Fashion";
  }

  return PROFILE_CATEGORIES.find((category) => category.value === value)?.label || "";
}
