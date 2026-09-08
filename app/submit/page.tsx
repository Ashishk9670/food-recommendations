"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import CategoryBadge from "@/components/CategoryBadge";
import StarRating from "@/components/StarRating";
import { detectCategory } from "@/lib/detectCategory";
import {
  MAX_DISH_NAME_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_PHOTOS_PER_RECOMMENDATION,
  MAX_PRICE,
  MAX_RESTAURANT_NAME_LENGTH,
  MAX_REVIEWER_NAME_LENGTH,
} from "@/lib/limits";
import { ALPHA_SPACE_PATTERN, PRICE_PATTERN, stripNonAlpha, stripNonPriceChars } from "@/lib/validation";
import { saveOwnerToken } from "@/lib/ownerTokens";

export default function SubmitPage() {
  const router = useRouter();
  const [dishName, setDishName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [rating, setRating] = useState(0);
  const [price, setPrice] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const detectedCategory = useMemo(() => detectCategory(dishName), [dishName]);

  function clearNoPhotoError() {
    setError((prev) => (prev === "Please choose at least one photo." ? null : prev));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS_PER_RECOMMENDATION);
    setImageFiles(files);
    setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
    clearNoPhotoError();
  }

  function handleRemoveImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    clearNoPhotoError();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!dishName.trim()) {
      setError("Please enter a dish name.");
      return;
    }
    if (!ALPHA_SPACE_PATTERN.test(dishName.trim())) {
      setError("Dish name can only contain letters and spaces.");
      return;
    }
    if (!restaurantName.trim()) {
      setError("Please enter the restaurant or place name.");
      return;
    }
    if (!ALPHA_SPACE_PATTERN.test(restaurantName.trim())) {
      setError("Restaurant name can only contain letters and spaces.");
      return;
    }
    if (rating < 1) {
      setError("Please choose a star rating.");
      return;
    }
    const priceValue = Number(price);
    if (
      !price.trim() ||
      !PRICE_PATTERN.test(price.trim()) ||
      !Number.isFinite(priceValue) ||
      priceValue < 0 ||
      priceValue > MAX_PRICE
    ) {
      setError(`Please enter a valid price (numbers only) between 0 and ${MAX_PRICE}.`);
      return;
    }
    if (imageFiles.length === 0) {
      setError("Please choose at least one photo.");
      return;
    }

    const formData = new FormData();
    formData.set("dishName", dishName);
    formData.set("restaurantName", restaurantName);
    formData.set("rating", String(rating));
    formData.set("price", price);
    formData.set("reviewerName", reviewerName);
    formData.set("notes", notes);
    for (const file of imageFiles) {
      formData.append("images", file);
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }
      const created = await res.json();
      saveOwnerToken(created.id, created.editToken);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-stone-900 dark:text-stone-100">
        Recommend a Dish
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="dishName" className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
            Dish name
          </label>
          <input
            id="dishName"
            type="text"
            value={dishName}
            onChange={(e) => setDishName(stripNonAlpha(e.target.value))}
            placeholder="e.g. Hyderabadi Chicken Biryani"
            maxLength={MAX_DISH_NAME_LENGTH}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-orange-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
          {dishName.trim() && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              Detected category: <CategoryBadge category={detectedCategory} />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="restaurantName" className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
            Restaurant / place
          </label>
          <input
            id="restaurantName"
            type="text"
            value={restaurantName}
            onChange={(e) => setRestaurantName(stripNonAlpha(e.target.value))}
            placeholder="e.g. Paradise Biryani"
            maxLength={MAX_RESTAURANT_NAME_LENGTH}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-orange-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-medium text-stone-700">Rating</legend>
          <StarRating value={rating} onChange={setRating} size="lg" />
        </fieldset>

        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
            Price after discount (₹)
          </label>
          <input
            id="price"
            type="number"
            min="0"
            max={MAX_PRICE}
            step="1"
            value={price}
            onChange={(e) => setPrice(stripNonPriceChars(e.target.value))}
            placeholder="e.g. 250"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-orange-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
        </div>

        <div>
          <label htmlFor="photo" className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
            Photos <span className="text-stone-400">(up to {MAX_PHOTOS_PER_RECOMMENDATION})</span>
          </label>
          <input
            id="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleImageChange}
            className="block w-full cursor-pointer rounded-lg border border-dashed border-orange-300 bg-orange-50/50 text-sm text-stone-500 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-orange-600 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white file:transition-colors hover:file:bg-orange-700 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-400"
          />
          {previewUrls.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {previewUrls.map((url, index) => (
                <div key={url} className="relative h-24 w-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    aria-label={`Remove photo ${index + 1}`}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-stone-900/80 text-sm leading-none text-white shadow hover:bg-stone-900 dark:bg-stone-100/90 dark:text-stone-900 dark:hover:bg-stone-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="reviewerName" className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
            Your name <span className="text-stone-400 dark:text-stone-500">(optional)</span>
          </label>
          <input
            id="reviewerName"
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="e.g. Ashish"
            maxLength={MAX_REVIEWER_NAME_LENGTH}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-orange-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
        </div>

        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
            Notes <span className="text-stone-400 dark:text-stone-500">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="What made it great?"
            maxLength={MAX_NOTES_LENGTH}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-orange-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-orange-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Recommendation"}
        </button>
      </form>
    </div>
  );
}
