import Image from "next/image";
import CategoryBadge from "./CategoryBadge";
import LikeButton from "./LikeButton";
import StarRating from "./StarRating";

type RecommendationCardProps = {
  id: number;
  dishName: string;
  category: string;
  rating: number;
  price: number;
  imageUrl: string;
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
  imageUrl,
  likeCount,
  restaurantName,
  reviewerName,
  notes,
}: RecommendationCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] w-full bg-gray-100">
        <Image
          src={imageUrl}
          alt={dishName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 break-words font-semibold text-gray-900">{dishName}</h3>
          <CategoryBadge category={category} />
        </div>
        {restaurantName && (
          <p className="truncate text-sm text-gray-500">at {restaurantName}</p>
        )}
        <div className="flex items-center justify-between">
          <StarRating value={rating} readOnly />
          <span className="font-semibold text-gray-900">₹{price}</span>
        </div>
        {notes && <p className="text-sm text-gray-600 line-clamp-2">{notes}</p>}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">{reviewerName ? `— ${reviewerName}` : ""}</p>
          <LikeButton id={id} initialLikeCount={likeCount} />
        </div>
      </div>
    </div>
  );
}
