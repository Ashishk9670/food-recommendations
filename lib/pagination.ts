export const PAGE_SIZE = 12;

export type SortMode = "newest" | "liked" | "rating" | "trending";

export type Cursor = {
  id: number;
  createdAt: string;
  likeCount: number;
  rating: number;
};

export function cursorFromRow(row: {
  id: number;
  createdAt: Date | string;
  likeCount: number;
  rating: number;
}): Cursor {
  // unstable_cache round-trips its return value through JSON, which turns Date
  // fields into plain strings — so createdAt may already be a string by the
  // time a cached row reaches here, not just a live Date from a fresh query.
  return {
    id: row.id,
    createdAt: new Date(row.createdAt).toISOString(),
    likeCount: row.likeCount,
    rating: row.rating,
  };
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(raw?: string): Cursor | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString());
    if (
      typeof parsed.id === "number" &&
      typeof parsed.createdAt === "string" &&
      typeof parsed.likeCount === "number" &&
      typeof parsed.rating === "number"
    ) {
      return parsed as Cursor;
    }
  } catch {
    // malformed/tampered cursor — treat as no cursor (first page)
  }
  return undefined;
}

type OrderClause = Record<string, "asc" | "desc">;

// Every sort mode gets an explicit `id` tiebreaker so a cursor is always well-defined,
// even for "Newest" which previously had none.
export function getOrderBy(sort: SortMode): OrderClause[] {
  if (sort === "liked" || sort === "trending") {
    return [{ likeCount: "desc" }, { createdAt: "desc" }, { id: "desc" }];
  }
  if (sort === "rating") {
    return [{ rating: "desc" }, { createdAt: "desc" }, { id: "desc" }];
  }
  return [{ createdAt: "desc" }, { id: "desc" }];
}

export function reverseOrderBy(orderBy: OrderClause[]): OrderClause[] {
  return orderBy.map((clause) => {
    const [key, dir] = Object.entries(clause)[0];
    return { [key]: dir === "desc" ? "asc" : "desc" };
  });
}

// wantAfter=true -> rows "further along" the descending display order (Next button)
// wantAfter=false -> rows "earlier" (Previous button; queried in reversed/ascending order)
export function buildSeekWhere(sort: SortMode, cursor: Cursor, wantAfter: boolean) {
  const cmp = wantAfter ? "lt" : "gt";
  const createdAt = new Date(cursor.createdAt);

  if (sort === "liked" || sort === "trending") {
    return {
      OR: [
        { likeCount: { [cmp]: cursor.likeCount } },
        { likeCount: cursor.likeCount, createdAt: { [cmp]: createdAt } },
        { likeCount: cursor.likeCount, createdAt, id: { [cmp]: cursor.id } },
      ],
    };
  }
  if (sort === "rating") {
    return {
      OR: [
        { rating: { [cmp]: cursor.rating } },
        { rating: cursor.rating, createdAt: { [cmp]: createdAt } },
        { rating: cursor.rating, createdAt, id: { [cmp]: cursor.id } },
      ],
    };
  }
  return {
    OR: [
      { createdAt: { [cmp]: createdAt } },
      { createdAt, id: { [cmp]: cursor.id } },
    ],
  };
}

export function startOfIsoWeek(): Date {
  const now = new Date();
  const day = now.getUTCDay() || 7; // Sunday -> 7
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - day + 1);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}
