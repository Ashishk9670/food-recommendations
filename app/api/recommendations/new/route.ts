import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MAX_ITEMS = 20;

// Polled by the header bell. Deliberately uncached: a review submitted a
// second ago should show up on the very next poll.
export async function GET(request: NextRequest) {
  const sinceRaw = request.nextUrl.searchParams.get("since");
  const since = sinceRaw ? new Date(sinceRaw) : null;
  if (!since || Number.isNaN(since.getTime())) {
    return NextResponse.json({ error: "A valid `since` timestamp is required." }, { status: 400 });
  }

  const items = await prisma.recommendation.findMany({
    where: { createdAt: { gt: since } },
    orderBy: { createdAt: "desc" },
    take: MAX_ITEMS,
    select: { id: true, dishName: true, restaurantName: true, createdAt: true },
  });

  return NextResponse.json({ items });
}
