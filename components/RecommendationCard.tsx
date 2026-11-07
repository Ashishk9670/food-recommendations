import { Bookmark, Flag, Heart, ImageIcon, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import CategoryBadge from "./CategoryBadge";
import LikeButton from "./LikeButton";
import OwnerActions from "./OwnerActions";
import ReportButton from "./ReportButton";
import SaveButton from "./SaveButton";
import StarRating from "./StarRating";
import { IMAGE_BLUR_DATA_URL } from "@/lib/imagePlaceholder";
import { restaurantSlug } from "@/lib/slug";

type RecommendationCardProps = {
  id: number;
  dishName: string;
  category: string;
  rating: number;
  price: number;
  primaryPhotoUrl: string;
  likeCount: number;
  restaurantName?: string | null;
  reviewerName?: string | null;
  notes?: string | null;
  // Static rendering for the submit page's live preview: no links, no live
  // like/report buttons, and it accepts a local blob: URL for the photo.
  preview?: boolean;
  // Position in its grid. The first row's photos are the likely LCP element,
  // so they skip lazy-loading; the very first is fetched at high priority.
  index?: number;
};

function MaybeLink({
  href,
  enabled,
  className,
  children,
}: {
  href: string;
  enabled: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return enabled ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

function ReviewerLine({
  name,
  inFigure = false,
  className = "",
}: {
  name: string;
  inFigure?: boolean;
  className?: string;
}) {
  const Tag = inFigure ? "figcaption" : "p";
  return (
    <Tag className={`flex items-center gap-1.5 text-xs font-medium text-faint ${className}`}>
      <span
        aria-hidden="true"
        className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-[10px] font-bold uppercase text-accent"
      >
        {name[0]}
      </span>
      — {name}
    </Tag>
  );
}

export default function RecommendationCard({
  id,
  dishName,
  category,
  rating,
  price,
  primaryPhotoUrl,
  likeCount,
  restaurantName,
  reviewerName,
  notes,
  preview = false,
  index,
}: RecommendationCardProps) {
  const href = `/recommendation/${id}`;

  return (
    <div
      data-testid={preview ? "recommendation-preview" : "recommendation-card"}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-card shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-border-hover hover:shadow-card-hover"
    >
      <MaybeLink href={href} enabled={!preview} className="block">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-card-muted">
          {primaryPhotoUrl ? (
            <Image
              src={primaryPhotoUrl}
              alt={dishName}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              {...(index !== undefined && index < 3 ? { loading: "eager" as const } : {})}
              {...(index === 0 ? { fetchPriority: "high" as const } : {})}
              {...(preview
                ? { unoptimized: true }
                : { placeholder: "blur" as const, blurDataURL: IMAGE_BLUR_DATA_URL })}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-faint">
              <ImageIcon aria-hidden="true" className="h-10 w-10" strokeWidth={1.5} />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
          {/* Solid backing: the dark-theme tag tints are translucent, which would
              let the photo show through and wash the badge out. */}
          <span className="absolute right-3 top-3 rounded-full bg-card shadow-sm">
            <CategoryBadge category={category} />
          </span>
          {rating > 0 && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-card/95 px-2 py-0.5 text-xs font-bold text-ink shadow-sm">
              <Star aria-hidden="true" className="h-3 w-3 fill-star text-star" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>
      </MaybeLink>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <MaybeLink href={href} enabled={!preview} className="min-w-0">
            <h3 className="line-clamp-2 break-words text-[17px] font-bold leading-6 tracking-tight text-ink group-hover:text-accent">
              {dishName}
            </h3>
          </MaybeLink>
          <span className="flex flex-shrink-0 flex-col items-end">
            {preview && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-faint">Paid</span>
            )}
            <span className="text-lg font-bold tracking-tight text-price">₹{price}</span>
          </span>
        </div>

        {restaurantName && (
          <p className="flex min-w-0 items-center gap-1 text-[13px] text-muted">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-accent" />
            {preview ? (
              <span className="truncate">at {restaurantName}</span>
            ) : (
              <Link
                href={`/restaurants/${restaurantSlug(restaurantName)}`}
                className="truncate hover:text-accent hover:underline"
              >
                at {restaurantName}
              </Link>
            )}
          </p>
        )}

        {notes ? (
          <figure className="mt-1 rounded-xl bg-card-muted px-3 py-2.5">
            <blockquote className="line-clamp-3 text-[13px] italic leading-5 text-muted">
              &ldquo;{notes}&rdquo;
            </blockquote>
            {reviewerName && <ReviewerLine name={reviewerName} inFigure className="mt-1.5 justify-end" />}
          </figure>
        ) : (
          reviewerName && <ReviewerLine name={reviewerName} />
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <StarRating value={rating} readOnly />
          <div className="flex items-center gap-1">
            {preview ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-semibold text-muted">
                  <Heart aria-hidden="true" className="h-[18px] w-[18px]" />
                  {likeCount}
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center text-faint">
                  <Bookmark aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center text-faint">
                  <Flag aria-hidden="true" className="h-4 w-4" />
                </span>
              </>
            ) : (
              <>
                <OwnerActions id={id} />
                <LikeButton id={id} initialLikeCount={likeCount} />
                <SaveButton id={id} />
                <ReportButton id={id} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
