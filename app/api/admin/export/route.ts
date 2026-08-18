import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/db";

function csvCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(values: (string | number | null | undefined)[]): string {
  return values.map(csvCell).join(",") + "\n";
}

export async function GET() {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const [recommendations, deletionLog] = await Promise.all([
    prisma.recommendation.findMany({
      include: { _count: { select: { photos: true, comments: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.deletionLog.findMany({ orderBy: { deletedAt: "desc" } }),
  ]);

  let csv = "Recommendations\n";
  csv += csvRow([
    "id",
    "dishName",
    "restaurantName",
    "category",
    "rating",
    "price",
    "likeCount",
    "reportCount",
    "photoCount",
    "commentCount",
    "createdAt",
  ]);
  for (const rec of recommendations) {
    csv += csvRow([
      rec.id,
      rec.dishName,
      rec.restaurantName,
      rec.category,
      rec.rating,
      rec.price,
      rec.likeCount,
      rec.reportCount,
      rec._count.photos,
      rec._count.comments,
      rec.createdAt.toISOString(),
    ]);
  }

  csv += "\nDeletion Log\n";
  csv += csvRow(["id", "dishName", "restaurantName", "deletedAt"]);
  for (const entry of deletionLog) {
    csv += csvRow([entry.id, entry.dishName, entry.restaurantName, entry.deletedAt.toISOString()]);
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="recommendations-export.csv"`,
    },
  });
}
