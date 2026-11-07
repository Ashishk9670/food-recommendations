// "Other" must stay last: detectCategory() falls back to the final entry.
export const CATEGORIES = [
  "Biryani",
  "Chicken",
  "Paneer",
  "Chinese",
  "South Indian",
  "Rolls & Bowls",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}
