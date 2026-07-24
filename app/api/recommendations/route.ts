import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CATEGORIES } from "@/lib/categories";

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
  const category = formData.get("category");
  const ratingRaw = formData.get("rating");
  const reviewerName = formData.get("reviewerName");
  const notes = formData.get("notes");
  const image = formData.get("image");

  if (typeof dishName !== "string" || !dishName.trim()) {
    return NextResponse.json({ error: "Dish name is required." }, { status: 400 });
  }
  if (typeof category !== "string" || !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return NextResponse.json({ error: "A valid category is required." }, { status: 400 });
  }
  const rating = Number(ratingRaw);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be a whole number from 1 to 5." }, { status: 400 });
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
      category,
      rating,
      imageUrl: `/uploads/${filename}`,
      reviewerName: typeof reviewerName === "string" && reviewerName.trim() ? reviewerName.trim() : null,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    },
  });

  return NextResponse.json(recommendation, { status: 201 });
}
