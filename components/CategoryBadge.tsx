const COLORS: Record<string, string> = {
  Biryani: "bg-tag-biryani-bg text-tag-biryani-fg",
  Chicken: "bg-tag-chicken-bg text-tag-chicken-fg",
  Paneer: "bg-tag-paneer-bg text-tag-paneer-fg",
  Chinese: "bg-tag-chinese-bg text-tag-chinese-fg",
  "South Indian": "bg-tag-southindian-bg text-tag-southindian-fg",
  "Rolls & Bowls": "bg-tag-rolls-bg text-tag-rolls-fg",
  Other: "bg-tag-other-bg text-tag-other-fg",
};

export default function CategoryBadge({
  category,
  className = "",
}: {
  category: string;
  className?: string;
}) {
  const colorClass = COLORS[category] ?? COLORS.Other;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${colorClass} ${className}`}
    >
      {category}
    </span>
  );
}
