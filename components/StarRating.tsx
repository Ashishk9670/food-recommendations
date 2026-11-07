"use client";

import { Star } from "lucide-react";

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
  const iconSize = size === "lg" ? "h-8 w-8" : "h-4 w-4";

  if (readOnly) {
    return (
      <div className="flex gap-0.5" aria-label={`${value} out of 5 stars`} role="img">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            aria-hidden="true"
            className={`${iconSize} ${star <= value ? "fill-star text-star" : "fill-star-off text-star-off"}`}
            strokeWidth={1.5}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        // p-1.5 keeps each tap target near the ~44px touch guideline.
        <button
          key={star}
          type="button"
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          aria-pressed={star <= value}
          onClick={() => onChange?.(star)}
          className="group rounded-full p-1.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Star
            aria-hidden="true"
            className={`${iconSize} transition-colors ${
              star <= value
                ? "fill-star text-star"
                : "fill-transparent text-faint group-hover:text-star"
            }`}
            strokeWidth={1.75}
          />
        </button>
      ))}
    </div>
  );
}
