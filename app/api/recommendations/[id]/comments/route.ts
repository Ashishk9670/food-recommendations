import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MAX_COMMENT_AUTHOR_NAME_LENGTH, MAX_COMMENT_BODY_LENGTH } from "@/lib/limits";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

const COMMENT_LIMIT = 10;
const COMMENT_WINDOW_MS = 60 * 1000;

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/recommendations/[id]/comments">,
) {
  const { id } = await ctx.params;
  const recommendationId = Number(id);
  if (!Number.isInteger(recommendationId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { recommendationId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/recommendations/[id]/comments">,
) {
  if (await isRateLimited(`comment:${getClientIp(request)}`, COMMENT_LIMIT, COMMENT_WINDOW_MS)) {
    return NextResponse.json({ error: "Too many comments. Please slow down." }, { status: 429 });
  }

  const { id } = await ctx.params;
  const recommendationId = Number(id);
  if (!Number.isInteger(recommendationId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const commentBody = body?.body;
  const authorName = body?.authorName;

  if (typeof commentBody !== "string" || !commentBody.trim()) {
    return NextResponse.json({ error: "A comment is required." }, { status: 400 });
  }
  if (commentBody.trim().length > MAX_COMMENT_BODY_LENGTH) {
    return NextResponse.json(
      { error: `Comments must be ${MAX_COMMENT_BODY_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }
  if (typeof authorName === "string" && authorName.trim().length > MAX_COMMENT_AUTHOR_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Your name must be ${MAX_COMMENT_AUTHOR_NAME_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  const comment = await prisma.comment
    .create({
      data: {
        recommendationId,
        body: commentBody.trim(),
        authorName: typeof authorName === "string" && authorName.trim() ? authorName.trim() : null,
      },
    })
    .catch(() => null);

  if (!comment) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json(comment, { status: 201 });
}
