import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { detectCategory } from "@/lib/detectCategory";
import { matchesImageSignature } from "@/lib/imageSignature";
import {
  MAX_DISH_NAME_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_PRICE,
  MAX_RESTAURANT_NAME_LENGTH,
  MAX_REVIEWER_NAME_LENGTH,
} from "@/lib/limits";
import { ALPHA_SPACE_PATTERN, PRICE_PATTERN } from "@/lib/validation";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const dishName = formData.get("dishName");
  const restaurantName = formData.get("restaurantName");
  const ratingRaw = formData.get("rating");
  const priceRaw = formData.get("price");
  const reviewerName = formData.get("reviewerName");
  const notes = formData.get("notes");
  const image = formData.get("image");

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
  if (typeof priceRaw !== "string" || !priceRaw.trim()) {
    return NextResponse.json({ error: "Price after discount is required." }, { status: 400 });
  }
  if (!PRICE_PATTERN.test(priceRaw.trim())) {
    return NextResponse.json(
      { error: "Price after discount can only contain numbers." },
      { status: 400 },
    );
  }
  const price = Number(priceRaw);
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
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "An image is required." }, { status: 400 });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image must be smaller than 5MB." }, { status: 400 });
  }
  const extension = ALLOWED_TYPES[image.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Image must be JPEG, PNG, WEBP, or GIF." },
      { status: 400 },
    );
  }
  const bytes = Buffer.from(await image.arrayBuffer());
  if (!matchesImageSignature(bytes, image.type)) {
    return NextResponse.json(
      { error: "File content doesn't match a valid JPEG, PNG, WEBP, or GIF image." },
      { status: 400 },
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);

  const recommendation = await prisma.recommendation.create({
    data: {
      dishName: dishName.trim(),
      category: detectCategory(dishName),
      rating,
      price,
      imageUrl: `/uploads/${filename}`,
      restaurantName: restaurantName.trim(),
      reviewerName: typeof reviewerName === "string" && reviewerName.trim() ? reviewerName.trim() : null,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    },
  });

  return NextResponse.json(recommendation, { status: 201 });
}
