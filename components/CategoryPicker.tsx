"use client";

import { Sparkles } from "lucide-react";
import CategoryBadge from "@/components/CategoryBadge";
import { CATEGORIES, type Category } from "@/lib/categories";

// Auto-detection picks the category as the dish name is typed; tapping a pill
// overrides it (tapping the detected one again goes back to auto). The
// selected value is `override ?? detected`.
export default function CategoryPicker({
  detected,
  override,
  onOverride,
  showDetected,
}: {
  detected: Category;
  override: Category | null;
  onOverride: (category: Category | null) => void;
  showDetected: boolean;
}) {
  const selected = override ?? detected;

  return (
    <div>
      <p id="category-label" className="mb-1.5 block text-sm font-semibold text-ink">
        Cuisine / category
      </p>
      <div role="radiogroup" aria-labelledby="category-label" className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const checked = selected === category;
          return (
            <button
              key={category}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onOverride(category === detected ? null : category)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                checked
                  ? "bg-primary text-on-primary shadow-primary"
                  : "border border-border-subtle bg-card text-ink hover:border-border-hover hover:bg-card-muted"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
      {showDetected && (
        <div
          data-testid="detected-category"
          className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px] text-muted"
        >
          <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
          Detected category: <CategoryBadge category={detected} />
          {override && override !== detected ? (
            <>
              <span>· you picked {override}</span>
              <button
                type="button"
                onClick={() => onOverride(null)}
                className="font-semibold text-accent hover:underline"
              >
                Use detected
              </button>
            </>
          ) : (
            <span>· tap another to change it</span>
          )}
        </div>
      )}
    </div>
  );
}
