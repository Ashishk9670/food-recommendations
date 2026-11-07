import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
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
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to browse
      </Link>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        <PhotoGallery photos={recommendation.photos} alt={recommendation.dishName} />
        <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-card p-6 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[28px] font-extrabold leading-9 tracking-tight text-ink">
              {recommendation.dishName}
            </h1>
            <CategoryBadge category={recommendation.category} className="mt-2 flex-shrink-0" />
          </div>
          {recommendation.restaurantName && (
            <p className="-mt-2 flex items-center gap-1.5 text-muted">
              <MapPin aria-hidden="true" className="h-4 w-4 text-accent" />
              at {recommendation.restaurantName}
            </p>
          )}
          <div className="flex items-center justify-between border-y border-border-subtle py-3">
            <StarRating value={recommendation.rating} readOnly />
            <span className="text-2xl font-bold tracking-tight text-price">₹{recommendation.price}</span>
          </div>
          {recommendation.notes ? (
            <figure className="rounded-xl bg-card-muted px-4 py-3">
              <blockquote className="italic leading-6 text-muted">
                &ldquo;{recommendation.notes}&rdquo;
              </blockquote>
              {recommendation.reviewerName && (
                <figcaption className="mt-1.5 text-right text-sm font-medium text-faint">
                  — {recommendation.reviewerName}
                </figcaption>
              )}
            </figure>
          ) : (
            recommendation.reviewerName && (
              <p className="text-sm font-medium text-faint">— {recommendation.reviewerName}</p>
            )
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            <OwnerActions id={recommendation.id} />
            <div className="ml-auto flex items-center gap-1">
              <LikeButton id={recommendation.id} initialLikeCount={recommendation.likeCount} />
              <ReportButton id={recommendation.id} />
            </div>
          </div>
        </div>
      </div>

      <section className="mt-10 rounded-2xl border border-border-subtle bg-card p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold tracking-tight text-ink">
          Comments ({recommendation.comments.length})
        </h2>
        <CommentList comments={recommendation.comments} />
        <div className="mt-6 border-t border-border-subtle pt-6">
          <CommentForm recommendationId={recommendation.id} />
        </div>
      </section>
    </div>
  );
}
