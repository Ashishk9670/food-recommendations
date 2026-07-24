const COLORS: Record<string, string> = {
  Biryani: "bg-amber-100 text-amber-800",
  Chicken: "bg-rose-100 text-rose-800",
  Paneer: "bg-lime-100 text-lime-800",
  Chinese: "bg-teal-100 text-teal-800",
  Other: "bg-stone-100 text-stone-700",
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
