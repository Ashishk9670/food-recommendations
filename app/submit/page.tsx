"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import CategoryBadge from "@/components/CategoryBadge";
import StarRating from "@/components/StarRating";
import { detectCategory } from "@/lib/detectCategory";
import {
  MAX_DISH_NAME_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_PRICE,
  MAX_RESTAURANT_NAME_LENGTH,
  MAX_REVIEWER_NAME_LENGTH,
} from "@/lib/limits";

export default function SubmitPage() {
  const router = useRouter();
  const [dishName, setDishName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [rating, setRating] = useState(0);
  const [price, setPrice] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const detectedCategory = useMemo(() => detectCategory(dishName), [dishName]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!dishName.trim()) {
      setError("Please enter a dish name.");
      return;
    }
    if (!restaurantName.trim()) {
      setError("Please enter the restaurant or place name.");
      return;
    }
    if (rating < 1) {
      setError("Please choose a star rating.");
      return;
    }
    const priceValue = Number(price);
    if (!price.trim() || !Number.isFinite(priceValue) || priceValue < 0 || priceValue > MAX_PRICE) {
      setError(`Please enter a valid price between 0 and ${MAX_PRICE}.`);
      return;
    }
    if (!imageFile) {
      setError("Please choose a photo.");
      return;
    }

    const formData = new FormData();
    formData.set("dishName", dishName);
    formData.set("restaurantName", restaurantName);
    formData.set("rating", String(rating));
    formData.set("price", price);
    formData.set("reviewerName", reviewerName);
    formData.set("notes", notes);
    formData.set("image", imageFile);

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
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Recommend a Dish
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Dish name
          </label>
          <input
            type="text"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            placeholder="e.g. Hyderabadi Chicken Biryani"
            maxLength={MAX_DISH_NAME_LENGTH}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
          />
          {dishName.trim() && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              Detected category: <CategoryBadge category={detectedCategory} />
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Restaurant / place
          </label>
          <input
            type="text"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            placeholder="e.g. Paradise Biryani"
            maxLength={MAX_RESTAURANT_NAME_LENGTH}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Rating
          </label>
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Price after discount (₹)
          </label>
          <input
            type="number"
            min="0"
            max={MAX_PRICE}
            step="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 250"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Photo
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
            className="w-full text-sm"
          />
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Preview"
              className="mt-3 h-48 w-full rounded-lg object-cover"
            />
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Your name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="e.g. Ashish"
            maxLength={MAX_REVIEWER_NAME_LENGTH}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Notes <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="What made it great?"
            maxLength={MAX_NOTES_LENGTH}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-gray-900 px-4 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Recommendation"}
        </button>
      </form>
    </div>
  );
}
