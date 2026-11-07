const COLORS: Record<string, string> = {
  Biryani: "bg-tag-biryani-bg text-tag-biryani-fg",
  Chicken: "bg-tag-chicken-bg text-tag-chicken-fg",
  Paneer: "bg-tag-paneer-bg text-tag-paneer-fg",
  Chinese: "bg-tag-chinese-bg text-tag-chinese-fg",
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${colorClass} ${className}`}
    >
      {category}
    </span>
  );
}
