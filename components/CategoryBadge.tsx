const COLORS: Record<string, string> = {
  Biryani: "bg-orange-100 text-orange-800",
  Chicken: "bg-red-100 text-red-800",
  Paneer: "bg-yellow-100 text-yellow-800",
  Chinese: "bg-green-100 text-green-800",
  Other: "bg-gray-100 text-gray-800",
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
