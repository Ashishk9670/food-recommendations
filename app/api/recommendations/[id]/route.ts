import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { detectCategory } from "@/lib/detectCategory";
import { deleteImage } from "@/lib/storage";
import {
  MAX_DISH_NAME_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_PRICE,
  MAX_RESTAURANT_NAME_LENGTH,
  MAX_REVIEWER_NAME_LENGTH,
} from "@/lib/limits";
import { ALPHA_SPACE_PATTERN, PRICE_PATTERN } from "@/lib/validation";

const RECOMMENDATION_PUBLIC_SELECT = {
  id: true,
  dishName: true,
  category: true,
  rating: true,
  price: true,
  imageUrl: true,
  restaurantName: true,
  reviewerName: true,
  notes: true,
  likeCount: true,
  createdAt: true,
} as const;

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/recommendations/[id]">,
) {
  const { id } = await ctx.params;
  const recommendationId = Number(id);
  if (!Number.isInteger(recommendationId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const recommendation = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
    select: RECOMMENDATION_PUBLIC_SELECT,
  });
  if (!recommendation) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json(recommendation);
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/recommendations/[id]">,
) {
  const { id } = await ctx.params;
  const recommendationId = Number(id);
  if (!Number.isInteger(recommendationId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const existing = await prisma.recommendation.findUnique({ where: { id: recommendationId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const providedToken = request.headers.get("x-edit-token") ?? body?.editToken;
  const cookieStore = await cookies();
  const isAdmin = isValidAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
  const isOwner = !!providedToken && !!existing.editToken && providedToken === existing.editToken;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { dishName, restaurantName, rating: ratingRaw, price: priceRaw, reviewerName, notes } = body ?? {};

  if (typeof dishName !== "string" || !dishName.trim()) {
    return NextResponse.json({ error: "Dish name is required." }, { status: 400 });
  }
  if (dishName.trim().length > MAX_DISH_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Dish name must be ${MAX_DISH_NAME_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }
  if (!ALPHA_SPACE_PATTERN.test(dishName.trim())) {
    return NextResponse.json(
      { error: "Dish name can only contain letters and spaces." },
      { status: 400 },
    );
  }
  if (typeof restaurantName !== "string" || !restaurantName.trim()) {
    return NextResponse.json({ error: "Restaurant name is required." }, { status: 400 });
  }
  if (restaurantName.trim().length > MAX_RESTAURANT_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Restaurant name must be ${MAX_RESTAURANT_NAME_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }
  if (!ALPHA_SPACE_PATTERN.test(restaurantName.trim())) {
    return NextResponse.json(
      { error: "Restaurant name can only contain letters and spaces." },
      { status: 400 },
    );
  }
  const rating = Number(ratingRaw);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be a whole number from 1 to 5." }, { status: 400 });
  }
  if (typeof priceRaw !== "string" && typeof priceRaw !== "number") {
    return NextResponse.json({ error: "Price after discount is required." }, { status: 400 });
  }
  const priceString = String(priceRaw).trim();
  if (!PRICE_PATTERN.test(priceString)) {
    return NextResponse.json(
      { error: "Price after discount can only contain numbers." },
      { status: 400 },
    );
  }
  const price = Number(priceString);
  if (!Number.isFinite(price) || price < 0 || price > MAX_PRICE) {
    return NextResponse.json(
      { error: `Price after discount must be a valid number between 0 and ${MAX_PRICE}.` },
      { status: 400 },
    );
  }
  if (typeof reviewerName === "string" && reviewerName.trim().length > MAX_REVIEWER_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Your name must be ${MAX_REVIEWER_NAME_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }
  if (typeof notes === "string" && notes.trim().length > MAX_NOTES_LENGTH) {
    return NextResponse.json(
      { error: `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  const updated = await prisma.recommendation.update({
    where: { id: recommendationId },
    data: {
      dishName: dishName.trim(),
      category: detectCategory(dishName),
      restaurantName: restaurantName.trim(),
      rating,
      price,
      reviewerName: typeof reviewerName === "string" && reviewerName.trim() ? reviewerName.trim() : null,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    },
    select: RECOMMENDATION_PUBLIC_SELECT,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/recommendations/[id]">,
) {
  const { id } = await ctx.params;
  const recommendationId = Number(id);
  if (!Number.isInteger(recommendationId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const recommendation = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
  });
  if (!recommendation) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const cookieStore = await cookies();
  const isAdmin = isValidAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
  const providedToken = request.headers.get("x-edit-token");
  const isOwner =
    !!providedToken && !!recommendation.editToken && providedToken === recommendation.editToken;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  await prisma.recommendation.delete({ where: { id: recommendationId } });
  await prisma.deletionLog.create({
    data: { dishName: recommendation.dishName, restaurantName: recommendation.restaurantName },
  });

  await deleteImage(recommendation.imageUrl).catch(() => {});

  return NextResponse.json({ ok: true });
}
