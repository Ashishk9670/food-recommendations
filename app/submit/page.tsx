"use client";

import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Eye,
  Flame,
  ImagePlus,
  Plus,
  Soup,
  Store,
  Upload,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import CategoryBadge from "@/components/CategoryBadge";
import RecommendationCard from "@/components/RecommendationCard";
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

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const RATING_LABELS: Record<number, string> = {
  1: "Not recommended",
  2: "Just okay",
  3: "Good — would eat again",
  4: "Really good, worth the trip",
  5: "Absolutely legendary, must try",
};

const subscribeNoop = () => () => {};

const inputClass =
  "w-full rounded-xl border-[1.5px] border-border-subtle bg-card px-3.5 py-2.5 text-[15px] text-ink placeholder:text-faint transition focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink";

function SectionTitle({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 border-b border-border-subtle pb-3 text-xs font-bold uppercase tracking-[0.1em] text-ink">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
      {step}. {children}
    </h2>
  );
}

export default function SubmitPage() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
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
  const [dragging, setDragging] = useState(false);
  // False during SSR and hydration, true once interactive. The photo buttons
  // work by clicking hidden inputs from JS, so before hydration they'd
  // silently do nothing — keep them disabled until they can actually work.
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const detectedCategory = useMemo(() => detectCategory(dishName), [dishName]);

  function clearNoPhotoError() {
    setError((prev) => (prev === "Please choose at least one photo." ? null : prev));
  }

  // Shared by the camera input, the upload input and drag-and-drop — appends
  // rather than replaces, so adding photos one way never wipes out ones added
  // another way. Room is computed before creating any object URLs so a
  // selection that overflows the cap never leaks an unused URL.
  function addImages(newFiles: File[]) {
    if (newFiles.length === 0) return;
    const room = Math.max(MAX_PHOTOS_PER_RECOMMENDATION - imageFiles.length, 0);
    const accepted = newFiles.slice(0, room);
    if (accepted.length === 0) return;
    setImageFiles((prev) => [...prev, ...accepted]);
    setPreviewUrls((prev) => [...prev, ...accepted.map((file) => URL.createObjectURL(file))]);
    clearNoPhotoError();
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    addImages(Array.from(e.target.files ?? []));
    // Reset so choosing the exact same file again still fires onChange.
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    addImages(Array.from(e.dataTransfer.files).filter((f) => ACCEPTED_IMAGE_TYPES.includes(f.type)));
  }

  function handleRemoveImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    clearNoPhotoError();
  }

  const hasDraft =
    !!dishName || !!restaurantName || rating > 0 || !!price || !!reviewerName || !!notes || imageFiles.length > 0;

  function handleDiscard() {
    if (!hasDraft) return;
    if (!confirm("Discard this draft? Everything you've entered will be cleared.")) return;
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setDishName("");
    setRestaurantName("");
    setRating(0);
    setPrice("");
    setReviewerName("");
    setNotes("");
    setImageFiles([]);
    setPreviewUrls([]);
    setError(null);
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

  const emptySlots = Math.max(MAX_PHOTOS_PER_RECOMMENDATION - previewUrls.length, 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to browse
      </Link>

      <header className="mb-8 max-w-2xl">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-tag-biryani-bg px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-tag-biryani-fg">
          <Flame aria-hidden="true" className="h-3.5 w-3.5" />
          Curate office flavors
        </span>
        <h1 className="text-[30px] font-extrabold leading-[38px] tracking-tight text-ink sm:text-[40px] sm:leading-[48px]">
          Recommend a Dish
        </h1>
        <p className="mt-2 text-base leading-6 text-muted">
          Had a great meal around the office or found a hidden lunchtime gem? Add your honest
          review and help fellow Triomics colleagues eat well.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <form
          onSubmit={handleSubmit}
          className="space-y-9 rounded-2xl border border-border-subtle bg-card p-5 shadow-card sm:p-8"
        >
          <section>
            <SectionTitle step={1}>Dish &amp; restaurant details</SectionTitle>
            <div className="space-y-5">
              <div>
                <label htmlFor="dishName" className={labelClass}>
                  Dish name <span aria-hidden="true" className="text-accent">*</span>
                </label>
                <div className="relative">
                  <Soup
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-faint"
                  />
                  <input
                    id="dishName"
                    type="text"
                    value={dishName}
                    onChange={(e) => setDishName(stripNonAlpha(e.target.value))}
                    placeholder="e.g. Hyderabadi Chicken Biryani"
                    maxLength={MAX_DISH_NAME_LENGTH}
                    className={`${inputClass} pl-10`}
                  />
                </div>
                {dishName.trim() && (
                  <div
                    data-testid="detected-category"
                    className="mt-2.5 flex items-center gap-2 text-[13px] text-muted"
                  >
                    Detected category: <CategoryBadge category={detectedCategory} />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="restaurantName" className={labelClass}>
                  Restaurant / place <span aria-hidden="true" className="text-accent">*</span>
                </label>
                <div className="relative">
                  <Store
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-faint"
                  />
                  <input
                    id="restaurantName"
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(stripNonAlpha(e.target.value))}
                    placeholder="e.g. Paradise Biryani"
                    maxLength={MAX_RESTAURANT_NAME_LENGTH}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>
          </section>

          <section>
            <SectionTitle step={2}>Experience &amp; pricing</SectionTitle>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <fieldset className="rounded-2xl bg-card-muted p-4">
                {/* The legend must stay the fieldset's first child to name it. */}
                <legend className="float-left mb-1 flex w-full items-baseline justify-between text-sm font-semibold text-ink">
                  <span>
                    Rating <span aria-hidden="true" className="text-accent">*</span>
                  </span>
                  <span aria-hidden="true" className="text-xl font-extrabold tracking-tight text-accent">
                    {rating > 0 ? rating.toFixed(1) : "–"}
                  </span>
                </legend>
                {/* Clear the floated legend, or the star row gets laid out beside
                    it and spills into the price column. */}
                <div className="clear-both">
                  <StarRating value={rating} onChange={setRating} size="lg" />
                </div>
                <p className="mt-1 min-h-5 text-[13px] text-muted">
                  {rating > 0 ? `${rating} stars — ${RATING_LABELS[rating]}` : "Tap a star to rate"}
                </p>
              </fieldset>

              <div>
                <label htmlFor="price" className={labelClass}>
                  Price after discount (₹) <span aria-hidden="true" className="text-accent">*</span>
                </label>
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-price"
                  >
                    ₹
                  </span>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    max={MAX_PRICE}
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(stripNonPriceChars(e.target.value))}
                    placeholder="e.g. 250"
                    className={`${inputClass} pl-8`}
                  />
                </div>
                <p className="mt-1.5 text-[13px] text-muted">
                  What you actually paid after any Swiggy / Zomato / dine-in discount.
                </p>
              </div>
            </div>
          </section>

          <fieldset>
            <legend className="mb-4 flex w-full items-center justify-between gap-2 border-b border-border-subtle pb-3 text-xs font-bold uppercase tracking-[0.1em] text-ink">
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
                3. Photos (up to {MAX_PHOTOS_PER_RECOMMENDATION})
              </span>
              <span className="hidden text-[11px] font-semibold normal-case tracking-normal text-faint sm:inline">
                JPEG, PNG, WEBP, GIF · max 5MB
              </span>
            </legend>
            {/* Camera-capture input: on phones (iOS/Android), `capture` makes the
                browser open the camera directly instead of a file browser. Desktop
                browsers ignore `capture`, which is exactly why the "Take Photo"
                button that triggers it is hidden there — it wouldn't do anything
                useful. */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              aria-label="Take photo"
              onChange={handleFilesSelected}
              className="hidden"
            />
            <input
              ref={uploadInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              multiple
              aria-label="Upload photos"
              onChange={handleFilesSelected}
              className="hidden"
            />
            <div
              data-testid="photo-dropzone"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                dragging ? "border-accent bg-accent-soft" : "border-border-hover bg-card-muted"
              }`}
            >
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-card text-accent shadow-card">
                <ImagePlus aria-hidden="true" className="h-6 w-6" />
              </span>
              <p className="text-base font-bold text-ink">
                <span className="hidden sm:inline">Drag and drop your food snaps here</span>
                <span className="sm:hidden">Add your food snaps</span>
              </p>
              <p className="mt-1 max-w-sm text-[13px] text-muted">
                Crisp overhead or side angles showing the portion and richness help teammates most.
              </p>
              <p className="mt-1 text-[11px] font-semibold text-faint sm:hidden">
                JPEG, PNG, WEBP, GIF · max 5MB
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={!hydrated}
                  className="sm:hidden inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-border-subtle bg-card px-4 py-2 text-sm font-semibold text-ink transition hover:border-border-hover disabled:opacity-50"
                >
                  <Camera aria-hidden="true" className="h-4 w-4" />
                  Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={!hydrated}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-primary transition hover:bg-primary-hover disabled:opacity-50"
                >
                  <Upload aria-hidden="true" className="h-4 w-4" />
                  Upload Photos
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {previewUrls.map((url, index) => (
                <div
                  key={url}
                  className="relative aspect-square overflow-hidden rounded-xl border border-border-subtle"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                  {index === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    aria-label={`Remove photo ${index + 1}`}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <button
                  key={`empty-${i}`}
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={!hydrated}
                  aria-label="Add another photo"
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-border-subtle bg-card-muted text-faint transition hover:border-border-hover hover:text-muted"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  <span aria-hidden="true" className="text-[11px] font-medium">
                    Photo {previewUrls.length + i + 1}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <section>
            <SectionTitle step={4}>Your notes</SectionTitle>
            <div className="space-y-5">
              <div>
                <label htmlFor="notes" className={labelClass}>
                  Notes <span className="font-normal text-faint">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="What made it great? Spice level, portion size, anything to order with it…"
                  maxLength={MAX_NOTES_LENGTH}
                  className={inputClass}
                />
              </div>
              <div className="sm:max-w-sm">
                <label htmlFor="reviewerName" className={labelClass}>
                  Your name <span className="font-normal text-faint">(optional)</span>
                </label>
                <div className="relative">
                  <User
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-faint"
                  />
                  <input
                    id="reviewerName"
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="e.g. Ashish"
                    maxLength={MAX_REVIEWER_NAME_LENGTH}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>
          </section>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={!hasDraft || submitting}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-card-muted hover:text-ink disabled:opacity-40"
            >
              Discard draft
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-[15px] font-semibold text-on-primary shadow-primary transition hover:-translate-y-px hover:bg-primary-hover disabled:translate-y-0 disabled:opacity-50"
            >
              <UtensilsCrossed aria-hidden="true" className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Recommendation"}
            </button>
          </div>
        </form>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <section className="rounded-2xl border border-border-subtle bg-card p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-ink">
              <Eye aria-hidden="true" className="h-4 w-4 text-price" />
              Live card preview
            </h2>
            <p className="mb-4 mt-1 text-[13px] text-muted">
              How your recommendation will appear in the feed.
            </p>
            <RecommendationCard
              preview
              id={0}
              dishName={dishName.trim() || "Your dish name"}
              category={detectedCategory}
              rating={rating}
              price={Number(price) || 0}
              primaryPhotoUrl={previewUrls[0] ?? ""}
              likeCount={0}
              restaurantName={restaurantName.trim() || "Restaurant name"}
              reviewerName={reviewerName.trim() || null}
              notes={notes.trim() || null}
            />
          </section>

          <section className="rounded-2xl border border-border-subtle bg-card p-5 shadow-card">
            <h2 className="mb-4 text-base font-bold text-ink">Before you submit</h2>
            <ul className="space-y-4">
              {[
                ["Keep it authentic", "Only dishes you've actually ordered and eaten yourself."],
                [
                  "Mention spice & portion",
                  "A line on spice level and portion size helps teammates decide fast.",
                ],
                ["Add a real photo", "Your own snap of the dish beats a menu picture every time."],
              ].map(([title, body]) => (
                <li key={title} className="flex gap-3">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-price" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{title}</p>
                    <p className="text-[13px] leading-5 text-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
