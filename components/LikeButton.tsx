"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "likedRecommendationIds";

function getLikedIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function rememberLikedId(id: number) {
  const ids = getLikedIds();
  ids.add(id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export default function LikeButton({
  id,
  initialLikeCount,
}: {
  id: number;
  initialLikeCount: number;
}) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLiked(getLikedIds().has(id));
  }, [id]);

  async function handleLike() {
    if (liked || submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/recommendations/${id}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setLikeCount(data.likeCount);
      setLiked(true);
      rememberLikedId(id);
    }
    setSubmitting(false);
  }

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={liked || submitting}
      aria-pressed={liked}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium transition-colors disabled:cursor-default ${
        liked ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      <span>{liked ? "❤️" : "🤍"}</span>
      <span>{likeCount}</span>
    </button>
  );
}
