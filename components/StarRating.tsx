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

  return (
    <div className={`flex gap-0.5 ${textSize}`}>
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
                : "text-gray-300"
              : `cursor-pointer transition-colors ${
                  star <= value ? "text-amber-400" : "text-gray-300 hover:text-amber-300"
                }`
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}
