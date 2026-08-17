export const RELATIONSHIP_STATUSES = [
  { value: "single", label: "Single" },
  { value: "in-a-relationship", label: "In a relationship" },
  { value: "engaged", label: "Engaged" },
  { value: "married", label: "Married" },
  { value: "complicated", label: "It’s complicated" },
  { value: "separated", label: "Separated" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
] as const;

export type RelationshipStatus = (typeof RELATIONSHIP_STATUSES)[number]["value"];

export function isRelationshipStatus(value: string) {
  return RELATIONSHIP_STATUSES.some((status) => status.value === value);
}

export function getRelationshipStatusLabel(value: string) {
  return RELATIONSHIP_STATUSES.find((status) => status.value === value)?.label || "";
}
