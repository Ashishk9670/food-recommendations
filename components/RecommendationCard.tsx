import Image from "next/image";
import Link from "next/link";
import CategoryBadge from "./CategoryBadge";
import LikeButton from "./LikeButton";
import OwnerActions from "./OwnerActions";
import ReportButton from "./ReportButton";
import StarRating from "./StarRating";
import { IMAGE_BLUR_DATA_URL } from "@/lib/imagePlaceholder";

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
};

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
}: RecommendationCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition-shadow hover:shadow-lg dark:border-stone-800 dark:bg-stone-900">
      <Link href={`/recommendation/${id}`} className="block">
        <div className="relative aspect-[4/3] w-full bg-orange-50 dark:bg-stone-800">
          <Image
            src={primaryPhotoUrl}
            alt={dishName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL={IMAGE_BLUR_DATA_URL}
          />
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/recommendation/${id}`} className="min-w-0">
            <h3 className="line-clamp-2 break-words font-semibold text-stone-900 hover:underline dark:text-stone-100">
              {dishName}
            </h3>
          </Link>
          <CategoryBadge category={category} />
        </div>
        {restaurantName && (
          <p className="truncate text-sm text-stone-500 dark:text-stone-400">at {restaurantName}</p>
        )}
        <div className="flex items-center justify-between">
          <StarRating value={rating} readOnly />
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">₹{price}</span>
        </div>
        {notes && <p className="text-sm text-stone-600 line-clamp-2 dark:text-stone-400">{notes}</p>}
        <div className="flex items-center justify-between">
          <p className="text-xs text-stone-400 dark:text-stone-500">{reviewerName ? `— ${reviewerName}` : ""}</p>
          <LikeButton id={id} initialLikeCount={likeCount} />
        </div>
        <div className="flex items-center justify-between">
          <OwnerActions id={id} />
          <ReportButton id={id} className="ml-auto" />
        </div>
      </div>
    </div>
  );
}
