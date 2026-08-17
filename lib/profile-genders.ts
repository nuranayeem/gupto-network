export const PROFILE_GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
] as const;

export type ProfileGender = (typeof PROFILE_GENDERS)[number]["value"];

export function isProfileGender(value: string) {
  return PROFILE_GENDERS.some((item) => item.value === value);
}

export function getProfileGenderLabel(value: string) {
  return PROFILE_GENDERS.find((item) => item.value === value)?.label || "";
}
