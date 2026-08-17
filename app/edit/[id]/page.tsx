"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { getOwnerToken } from "@/lib/ownerTokens";
import { ALPHA_SPACE_PATTERN, PRICE_PATTERN, stripNonAlpha, stripNonPriceChars } from "@/lib/validation";

export default function EditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [dishName, setDishName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [rating, setRating] = useState(0);
  const [price, setPrice] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const detectedCategory = useMemo(() => detectCategory(dishName), [dishName]);

  useEffect(() => {
    setToken(getOwnerToken(id) ?? null);
  }, [id]);

  useEffect(() => {
    if (!Number.isInteger(id)) return;
    fetch(`/api/recommendations/${id}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setDishName(data.dishName);
        setRestaurantName(data.restaurantName ?? "");
        setRating(data.rating);
        setPrice(String(data.price));
        setReviewerName(data.reviewerName ?? "");
        setNotes(data.notes ?? "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (token === undefined || loading) {
    return <div className="mx-auto max-w-lg px-4 py-16 text-center text-stone-500">Loading…</div>;
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-stone-700">You don&apos;t have permission to edit this post.</p>
        <Link href="/" className="mt-4 inline-block font-medium text-orange-600 underline">
          Back to Browse Recommendations
        </Link>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-stone-700">This recommendation no longer exists.</p>
        <Link href="/" className="mt-4 inline-block font-medium text-orange-600 underline">
          Back to Browse Recommendations
        </Link>
      </div>
    );
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

    setSubmitting(true);
    try {
      const res = await fetch(`/api/recommendations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-edit-token": token as string },
        body: JSON.stringify({ dishName, restaurantName, rating, price, reviewerName, notes }),
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
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Edit Your Recommendation</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="edit-dishName" className="mb-1 block text-sm font-medium text-stone-700">
            Dish name
          </label>
          <input
            id="edit-dishName"
            type="text"
            value={dishName}
            onChange={(e) => setDishName(stripNonAlpha(e.target.value))}
            maxLength={MAX_DISH_NAME_LENGTH}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          />
          {dishName.trim() && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              Detected category: <CategoryBadge category={detectedCategory} />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="edit-restaurantName" className="mb-1 block text-sm font-medium text-stone-700">
            Restaurant / place
          </label>
          <input
            id="edit-restaurantName"
            type="text"
            value={restaurantName}
            onChange={(e) => setRestaurantName(stripNonAlpha(e.target.value))}
            maxLength={MAX_RESTAURANT_NAME_LENGTH}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-stone-700">Rating</span>
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>

        <div>
          <label htmlFor="edit-price" className="mb-1 block text-sm font-medium text-stone-700">
            Price after discount (₹)
          </label>
          <input
            id="edit-price"
            type="number"
            min="0"
            max={MAX_PRICE}
            step="1"
            value={price}
            onChange={(e) => setPrice(stripNonPriceChars(e.target.value))}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="edit-reviewerName" className="mb-1 block text-sm font-medium text-stone-700">
            Your name <span className="text-stone-400">(optional)</span>
          </label>
          <input
            id="edit-reviewerName"
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            maxLength={MAX_REVIEWER_NAME_LENGTH}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="edit-notes" className="mb-1 block text-sm font-medium text-stone-700">
            Notes <span className="text-stone-400">(optional)</span>
          </label>
          <textarea
            id="edit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={MAX_NOTES_LENGTH}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-orange-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
