import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MAX_IDS = 100;

// Card data for a list of ids, for the per-device "My recommendations" and
// "Saved" lists. Missing ids (deleted posts) are simply absent from the result.
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = [...new Set(raw.split(",").map(Number).filter((id) => Number.isInteger(id) && id > 0))];
  if (ids.length > MAX_IDS) {
    return NextResponse.json({ error: `At most ${MAX_IDS} ids.` }, { status: 400 });
  }
  if (ids.length === 0) return NextResponse.json({ items: [] });

  const rows = await prisma.recommendation.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      dishName: true,
      category: true,
      rating: true,
      price: true,
      likeCount: true,
      restaurantName: true,
      reviewerName: true,
      notes: true,
      photos: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  });
  const items = rows.map(({ photos, ...rest }) => ({ ...rest, primaryPhotoUrl: photos[0]?.url ?? "" }));
  return NextResponse.json({ items });
}
