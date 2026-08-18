import { notFound } from "next/navigation";
import CategoryBadge from "@/components/CategoryBadge";
import CommentForm from "@/components/CommentForm";
import CommentList from "@/components/CommentList";
import LikeButton from "@/components/LikeButton";
import OwnerActions from "@/components/OwnerActions";
import PhotoGallery from "@/components/PhotoGallery";
import ReportButton from "@/components/ReportButton";
import StarRating from "@/components/StarRating";
import { prisma } from "@/lib/db";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecommendationPage({ params }: PageProps) {
  const { id } = await params;
  const recommendationId = Number(id);
  if (!Number.isInteger(recommendationId)) {
    notFound();
  }

  const recommendation = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
    include: {
      photos: { orderBy: { order: "asc" } },
      comments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!recommendation) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <PhotoGallery photos={recommendation.photos} alt={recommendation.dishName} />
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{recommendation.dishName}</h1>
            <CategoryBadge category={recommendation.category} />
          </div>
          {recommendation.restaurantName && (
            <p className="text-stone-500 dark:text-stone-400">at {recommendation.restaurantName}</p>
          )}
          <div className="flex items-center justify-between">
            <StarRating value={recommendation.rating} readOnly />
            <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">₹{recommendation.price}</span>
          </div>
          {recommendation.notes && <p className="text-stone-600 dark:text-stone-400">{recommendation.notes}</p>}
          {recommendation.reviewerName && (
            <p className="text-sm text-stone-400 dark:text-stone-500">— {recommendation.reviewerName}</p>
          )}
          <div className="flex items-center justify-between pt-2">
            <LikeButton id={recommendation.id} initialLikeCount={recommendation.likeCount} />
            <ReportButton id={recommendation.id} />
          </div>
          <OwnerActions id={recommendation.id} />
        </div>
      </div>

      <div className="mt-10 space-y-4">
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
          Comments ({recommendation.comments.length})
        </h2>
        <CommentList comments={recommendation.comments} />
        <div className="border-t border-stone-200 pt-4 dark:border-stone-800">
          <CommentForm recommendationId={recommendation.id} />
        </div>
      </div>
    </div>
  );
}
