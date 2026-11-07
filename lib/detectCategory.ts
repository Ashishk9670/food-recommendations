import { CATEGORIES, type Category } from "@/lib/categories";

// First match wins, so order matters: the more specific dish style comes
// before the main ingredient ("Chicken Manchurian" is Chinese, "Paneer Kathi
// Roll" is a roll, "Paneer Dosa" is South Indian), and Chinese comes before
// Rolls so a spring roll stays Chinese.
export const KEYWORD_RULES: { category: Category; keywords: string[] }[] = [
  { category: "Biryani", keywords: ["biryani", "pulao", "pilaf"] },
  {
    category: "Chinese",
    keywords: [
      "manchurian",
      "chowmein",
      "chow mein",
      "noodle",
      "fried rice",
      "hakka",
      "schezwan",
      "szechuan",
      "spring roll",
      "dumpling",
      "momo",
    ],
  },
  {
    category: "Rolls & Bowls",
    keywords: ["roll", "wrap", "kathi", "kati", "frankie", "shawarma", "burrito", "bowl"],
  },
  {
    category: "South Indian",
    keywords: [
      "dosa",
      "dosai",
      "idli",
      "idly",
      "vada",
      "vadai",
      "uttapam",
      "uthappam",
      "sambar",
      "rasam",
      "pongal",
      "upma",
      "appam",
      "puttu",
      "pesarattu",
      "bisi bele",
      "curd rice",
      "lemon rice",
      "parotta",
      "chettinad",
      "ghee roast",
      "avial",
      "bonda",
    ],
  },
  { category: "Paneer", keywords: ["paneer", "cottage cheese"] },
  { category: "Chicken", keywords: ["chicken", "tikka", "tandoori", "wing"] },
];

export function detectCategory(dishName: string): Category {
  const name = dishName.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((keyword) => name.includes(keyword))) {
      return rule.category;
    }
  }
  return CATEGORIES[CATEGORIES.length - 1];
}
