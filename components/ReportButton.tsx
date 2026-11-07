"use client";

import { Flag } from "lucide-react";
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
      aria-label={reported ? "Reported" : "Report"}
      title={reported ? "Reported" : "Report as inappropriate or inaccurate"}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:cursor-default ${
        reported ? "text-danger" : "text-faint hover:bg-danger-soft hover:text-danger"
      } ${className}`}
    >
      <Flag aria-hidden="true" className={`h-4 w-4 ${reported ? "fill-danger" : ""}`} strokeWidth={2} />
    </button>
  );
}
