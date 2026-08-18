const COLORS: Record<string, string> = {
  Biryani: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Chicken: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  Paneer: "bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300",
  Chinese: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  Other: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
};

export default function CategoryBadge({ category }: { category: string }) {
  const colorClass = COLORS[category] ?? COLORS.Other;

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {category}
    </span>
  );
}
