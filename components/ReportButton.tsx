"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "reportedRecommendationIds";

function getReportedIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function rememberReportedId(id: number) {
  const ids = getReportedIds();
  ids.add(id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export default function ReportButton({ id, className = "" }: { id: number; className?: string }) {
  const [reported, setReported] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // localStorage is unavailable during SSR, so this can't be a lazy useState
    // initializer without causing a hydration mismatch — it has to run after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReported(getReportedIds().has(id));
  }, [id]);

  async function handleReport() {
    if (reported || submitting) return;
    if (!confirm("Report this recommendation as inappropriate or inaccurate?")) return;
    setSubmitting(true);
    const res = await fetch(`/api/recommendations/${id}/report`, { method: "POST" });
    if (res.ok) {
      setReported(true);
      rememberReportedId(id);
    }
    setSubmitting(false);
  }

  return (
    <button
      type="button"
      onClick={handleReport}
      disabled={reported || submitting}
      className={`text-xs font-medium text-stone-400 hover:text-red-500 disabled:cursor-default disabled:hover:text-stone-400 dark:text-stone-500 dark:hover:text-red-400 dark:disabled:hover:text-stone-500 ${className}`}
    >
      {reported ? "Reported" : "🚩 Report"}
    </button>
  );
}
