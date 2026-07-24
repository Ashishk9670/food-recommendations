import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CategoryBadge from "@/components/CategoryBadge";
import DeleteRecommendationButton from "@/components/DeleteRecommendationButton";
import StarRating from "@/components/StarRating";
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE)?.value)) {
    redirect("/admin/login");
  }

  const recommendations = await prisma.recommendation.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Admin Dashboard ({recommendations.length})
        </h1>
        <form action="/api/admin/logout" method="post">
          <button
            type="submit"
            className="text-sm font-medium text-gray-500 underline hover:text-gray-900"
          >
            Log out
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-3"
          >
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
              <Image src={rec.imageUrl} alt={rec.dishName} fill className="object-cover" sizes="64px" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold text-gray-900">{rec.dishName}</h3>
                <CategoryBadge category={rec.category} />
              </div>
              {rec.restaurantName && (
                <p className="text-sm text-gray-500">at {rec.restaurantName}</p>
              )}
              <div className="flex items-center gap-3">
                <StarRating value={rec.rating} readOnly />
                <span className="text-sm font-semibold text-gray-900">₹{rec.price}</span>
              </div>
              {rec.reviewerName && (
                <p className="text-xs text-gray-400">— {rec.reviewerName}</p>
              )}
            </div>
            <DeleteRecommendationButton id={rec.id} />
          </div>
        ))}
        {recommendations.length === 0 && (
          <p className="py-12 text-center text-gray-500">No recommendations yet.</p>
        )}
      </div>
    </div>
  );
}
