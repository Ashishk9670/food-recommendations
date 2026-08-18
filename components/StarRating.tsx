"use client";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "lg";
};

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "sm",
}: StarRatingProps) {
  const textSize = size === "lg" ? "text-3xl" : "text-lg";
  // extra padding on the interactive variant keeps each star's tap target close to the
  // ~44px minimum recommended for touchscreens, since the glyph alone is much smaller;
  // the padding itself provides spacing, so no gap is needed on the container
  const tapPadding = readOnly ? "" : "p-2";

  return (
    <div className={`flex ${readOnly ? "gap-0.5" : ""} ${textSize}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          role={readOnly ? undefined : "button"}
          aria-label={readOnly ? undefined : `Rate ${star} star${star > 1 ? "s" : ""}`}
          onClick={readOnly ? undefined : () => onChange?.(star)}
          className={
            readOnly
              ? star <= value
                ? "text-amber-400"
                : "text-gray-300 dark:text-stone-600"
              : `inline-block cursor-pointer transition-colors ${tapPadding} ${
                  star <= value
                    ? "text-amber-400"
                    : "text-gray-300 hover:text-amber-300 dark:text-stone-600 dark:hover:text-amber-400"
                }`
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}
