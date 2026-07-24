import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { detectCategory } from "@/lib/detectCategory";

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
  if (typeof restaurantName !== "string" || !restaurantName.trim()) {
    return NextResponse.json({ error: "Restaurant name is required." }, { status: 400 });
  }
  const rating = Number(ratingRaw);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be a whole number from 1 to 5." }, { status: 400 });
  }
  if (typeof priceRaw !== "string" || !priceRaw.trim()) {
    return NextResponse.json({ error: "Price after discount is required." }, { status: 400 });
  }
  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Price after discount must be a valid, non-negative number." }, { status: 400 });
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

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await image.arrayBuffer());
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
