"use client";

import { Bookmark, NotebookPen } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RecommendationCard from "@/components/RecommendationCard";
import { removeSaved, useOwnedIds, useSavedIds } from "@/lib/localLists";

type CardData = {
  id: number;
  dishName: string;
  category: string;
  rating: number;
  price: number;
  likeCount: number;
  restaurantName: string;
  reviewerName: string | null;
  notes: string | null;
  primaryPhotoUrl: string;
};

function Grid({ items }: { items: CardData[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <RecommendationCard key={item.id} {...item} />
      ))}
    </div>
  );
}

function Empty({ children, cta }: { children: React.ReactNode; cta: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-hover bg-card px-6 py-10 text-center">
      <p className="mb-4 text-sm text-muted">{children}</p>
      <Link
        href={cta.href}
        className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-primary transition hover:bg-primary-hover"
      >
        {cta.label}
      </Link>
    </div>
  );
}

export default function MyLists() {
  const ownedIds = useOwnedIds();
  const savedIds = useSavedIds();
  const allIds = useMemo(
    () => [...new Set([...ownedIds, ...savedIds])].sort((a, b) => a - b).join(","),
    [ownedIds, savedIds],
  );
  // Tagged with the id list it was fetched for, so a slow response for an
  // older list can never be mistaken for the current one.
  const [result, setResult] = useState<{ ids: string; cards: Map<number, CardData> } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/recommendations/by-ids?ids=${allIds}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(({ items }: { items: CardData[] }) => {
        if (cancelled) return;
        setFailed(false);
        setResult({ ids: allIds, cards: new Map(items.map((item) => [item.id, item])) });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [allIds]);

  const cards = result?.ids === allIds ? result.cards : null;

  // Bookmarks of posts that have since been deleted are dropped quietly.
  useEffect(() => {
    if (cards) removeSaved(savedIds.filter((id) => !cards.has(id)));
  }, [cards, savedIds]);

  const owned = cards ? ownedIds.map((id) => cards.get(id)).filter((c): c is CardData => !!c) : [];
  const saved = cards ? savedIds.map((id) => cards.get(id)).filter((c): c is CardData => !!c) : [];
  const loading = !cards && !failed;

  return (
    <div className="space-y-12">
      <section aria-labelledby="mine-heading">
        <h2 id="mine-heading" className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
          <NotebookPen aria-hidden="true" className="h-5 w-5 text-accent" />
          Posted from this browser {cards && <span className="text-muted">({owned.length})</span>}
        </h2>
        {failed ? (
          <p role="alert" className="text-sm text-danger">Couldn&apos;t load your posts. Try refreshing.</p>
        ) : loading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-card-muted" />
        ) : owned.length ? (
          <Grid items={owned} />
        ) : (
          <Empty cta={{ href: "/submit", label: "Recommend a dish" }}>
            Nothing posted from this browser yet.
          </Empty>
        )}
      </section>

      <section id="saved" aria-labelledby="saved-heading" className="scroll-mt-24">
        <h2 id="saved-heading" className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
          <Bookmark aria-hidden="true" className="h-5 w-5 text-accent" />
          Saved dishes {cards && <span className="text-muted">({saved.length})</span>}
        </h2>
        {failed ? null : loading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-card-muted" />
        ) : saved.length ? (
          <Grid items={saved} />
        ) : (
          <Empty cta={{ href: "/", label: "Browse dishes" }}>
            Tap the bookmark on any dish to keep it here for later.
          </Empty>
        )}
      </section>
    </div>
  );
}
