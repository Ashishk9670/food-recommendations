export const CATEGORIES = [
  "Biryani",
  "Chicken",
  "Paneer",
  "Chinese",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
