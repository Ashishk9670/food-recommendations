import Image from "next/image";
import AdminNav from "@/components/AdminNav";
import CategoryBadge from "@/components/CategoryBadge";
import DeleteRecommendationButton from "@/components/DeleteRecommendationButton";
import StarRating from "@/components/StarRating";
import { requireAdminPage } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { IMAGE_BLUR_DATA_URL } from "@/lib/imagePlaceholder";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireAdminPage();

  const recommendations = await prisma.recommendation.findMany({
    orderBy: { createdAt: "desc" },
    include: { photos: { where: { isPrimary: true }, take: 1 } },
  });
  const reportedCount = recommendations.filter((rec) => rec.reportCount > 0).length;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <AdminNav session={session} current="dashboard" reportedCount={reportedCount} />
      <h1 className="mb-4 text-2xl font-bold text-ink">
        Admin Dashboard ({recommendations.length})
      </h1>

      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            data-testid="admin-row"
            className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-card p-3 shadow-card sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-card-muted">
              {rec.photos[0] && (
                <Image
                  src={rec.photos[0].url}
                  alt={rec.dishName}
                  fill
                  className="object-cover"
                  sizes="64px"
                  placeholder="blur"
                  blurDataURL={IMAGE_BLUR_DATA_URL}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold text-ink">{rec.dishName}</h3>
                <CategoryBadge category={rec.category} />
                {rec.reportCount > 0 && (
                  <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
                    🚩 {rec.reportCount} report{rec.reportCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {rec.restaurantName && (
                <p className="truncate text-sm text-muted">at {rec.restaurantName}</p>
              )}
              <div className="flex items-center gap-3">
                <StarRating value={rec.rating} readOnly />
                <span className="text-sm font-semibold text-price">₹{rec.price}</span>
                <span className="text-sm text-muted">❤️ {rec.likeCount}</span>
              </div>
              {rec.reviewerName && (
                <p className="text-xs text-faint">— {rec.reviewerName}</p>
              )}
            </div>
            <DeleteRecommendationButton id={rec.id} />
          </div>
        ))}
        {recommendations.length === 0 && (
          <p className="py-12 text-center text-muted">No recommendations yet.</p>
        )}
      </div>
    </div>
  );
}
