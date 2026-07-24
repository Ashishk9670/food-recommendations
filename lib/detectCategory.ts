import { CATEGORIES, type Category } from "@/lib/categories";

const KEYWORD_RULES: { category: Category; keywords: string[] }[] = [
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
