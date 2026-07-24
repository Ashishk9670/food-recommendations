import Image from "next/image";
import CategoryBadge from "./CategoryBadge";
import StarRating from "./StarRating";

type RecommendationCardProps = {
  dishName: string;
  category: string;
  rating: number;
  imageUrl: string;
  reviewerName?: string | null;
  notes?: string | null;
};

export default function RecommendationCard({
  dishName,
  category,
  rating,
  imageUrl,
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
          <h3 className="font-semibold text-gray-900">{dishName}</h3>
          <CategoryBadge category={category} />
        </div>
        <StarRating value={rating} readOnly />
        {notes && <p className="text-sm text-gray-600 line-clamp-2">{notes}</p>}
        {reviewerName && (
          <p className="text-xs text-gray-400">— {reviewerName}</p>
        )}
      </div>
    </div>
  );
}
