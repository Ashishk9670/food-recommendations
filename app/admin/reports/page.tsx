import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CategoryBadge from "@/components/CategoryBadge";
import DismissReportsButton from "@/components/DismissReportsButton";
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE)?.value)) {
    redirect("/admin/login");
  }

  const recommendations = await prisma.recommendation.findMany({
    where: { reportCount: { gt: 0 } },
    orderBy: [{ reportCount: "desc" }, { createdAt: "desc" }],
    include: { photos: { where: { isPrimary: true }, take: 1 } },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Moderation Queue ({recommendations.length})
        </h1>
        <Link href="/admin" className="text-sm font-medium text-slate-500 underline hover:text-slate-900">
          Back to dashboard
        </Link>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {rec.photos[0] && (
                <Image src={rec.photos[0].url} alt={rec.dishName} fill className="object-cover" sizes="64px" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold text-slate-900">{rec.dishName}</h3>
                <CategoryBadge category={rec.category} />
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  🚩 {rec.reportCount} report{rec.reportCount > 1 ? "s" : ""}
                </span>
              </div>
              {rec.restaurantName && (
                <p className="truncate text-sm text-slate-500">at {rec.restaurantName}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/recommendation/${rec.id}`}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                View
              </Link>
              <DismissReportsButton id={rec.id} />
            </div>
          </div>
        ))}
        {recommendations.length === 0 && (
          <p className="py-12 text-center text-slate-500">No unresolved reports.</p>
        )}
      </div>
    </div>
  );
}
