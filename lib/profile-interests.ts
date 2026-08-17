export const PROFILE_INTERESTS = [
  { value: "travel", label: "Travel" },
  { value: "photography", label: "Photography" },
  { value: "food-dining", label: "Food & Dining" },
  { value: "cooking", label: "Cooking" },
  { value: "baking", label: "Baking" },
  { value: "coffee", label: "Coffee" },
  { value: "reading", label: "Reading" },
  { value: "writing", label: "Writing" },
  { value: "music", label: "Music" },
  { value: "singing", label: "Singing" },
  { value: "movies-tv", label: "Movies & TV" },
  { value: "gaming", label: "Gaming" },
  { value: "sports", label: "Sports" },
  { value: "football", label: "Football" },
  { value: "cricket", label: "Cricket" },
  { value: "fitness", label: "Fitness" },
  { value: "running", label: "Running" },
  { value: "cycling", label: "Cycling" },
  { value: "swimming", label: "Swimming" },
  { value: "hiking", label: "Hiking" },
  { value: "camping", label: "Camping" },
  { value: "nature", label: "Nature" },
  { value: "gardening", label: "Gardening" },
  { value: "pets", label: "Pets" },
  { value: "art", label: "Art" },
  { value: "drawing", label: "Drawing" },
  { value: "painting", label: "Painting" },
  { value: "design", label: "Design" },
  { value: "fashion", label: "Fashion" },
  { value: "beauty", label: "Beauty" },
  { value: "technology", label: "Technology" },
  { value: "coding", label: "Coding" },
  { value: "ai", label: "Artificial Intelligence" },
  { value: "science", label: "Science" },
  { value: "history", label: "History" },
  { value: "languages", label: "Languages" },
  { value: "cars", label: "Cars" },
  { value: "motorcycles", label: "Motorcycles" },
  { value: "business", label: "Business" },
  { value: "entrepreneurship", label: "Entrepreneurship" },
  { value: "investing", label: "Investing" },
  { value: "volunteering", label: "Volunteering" },
  { value: "meditation", label: "Meditation" },
  { value: "yoga", label: "Yoga" },
  { value: "diy-crafts", label: "DIY & Crafts" },
  { value: "home-living", label: "Home & Living" },
  { value: "parenting", label: "Parenting" },
  { value: "shopping", label: "Shopping" },
] as const;

export type ProfileInterest = (typeof PROFILE_INTERESTS)[number]["value"];

export function isProfileInterest(value: string) {
  return PROFILE_INTERESTS.some((item) => item.value === value);
}

export function getProfileInterestLabel(value: string) {
  return PROFILE_INTERESTS.find((item) => item.value === value)?.label || value;
}

export function normalizeProfileInterests(values: string[]) {
  const normalized = values.map((value) => value.trim()).filter(Boolean);
  if (normalized.some((value) => !isProfileInterest(value))) return null;
  return Array.from(new Set(normalized));
}
