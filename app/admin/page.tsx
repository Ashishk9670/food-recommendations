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
        <h1 className="text-2xl font-bold text-slate-900">
          Admin Dashboard ({recommendations.length})
        </h1>
        <form action="/api/admin/logout" method="post">
          <button
            type="submit"
            className="text-sm font-medium text-slate-500 underline hover:text-slate-900"
          >
            Log out
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
              <Image src={rec.imageUrl} alt={rec.dishName} fill className="object-cover" sizes="64px" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold text-slate-900">{rec.dishName}</h3>
                <CategoryBadge category={rec.category} />
                {rec.reportCount > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    🚩 {rec.reportCount} report{rec.reportCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {rec.restaurantName && (
                <p className="truncate text-sm text-slate-500">at {rec.restaurantName}</p>
              )}
              <div className="flex items-center gap-3">
                <StarRating value={rec.rating} readOnly />
                <span className="text-sm font-semibold text-emerald-700">₹{rec.price}</span>
                <span className="text-sm text-slate-500">❤️ {rec.likeCount}</span>
              </div>
              {rec.reviewerName && (
                <p className="text-xs text-slate-400">— {rec.reviewerName}</p>
              )}
            </div>
            <DeleteRecommendationButton id={rec.id} />
          </div>
        ))}
        {recommendations.length === 0 && (
          <p className="py-12 text-center text-slate-500">No recommendations yet.</p>
        )}
      </div>
    </div>
  );
}
