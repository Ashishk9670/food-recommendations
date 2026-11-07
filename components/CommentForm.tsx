"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_COMMENT_AUTHOR_NAME_LENGTH, MAX_COMMENT_BODY_LENGTH } from "@/lib/limits";

export default function CommentForm({ recommendationId }: { recommendationId: number }) {
  const router = useRouter();
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!body.trim()) {
      setError("Please enter a comment.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/recommendations/${recommendationId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }
      setAuthorName("");
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="comment-author" className="mb-1 block text-sm font-medium text-ink">
          Your name <span className="text-faint">(optional)</span>
        </label>
        <input
          id="comment-author"
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={MAX_COMMENT_AUTHOR_NAME_LENGTH}
          className="w-full rounded-xl border-[1.5px] border-border-subtle bg-card px-3.5 py-2.5 text-[15px] text-ink placeholder:text-faint transition focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
        />
      </div>
      <div>
        <label htmlFor="comment-body" className="mb-1 block text-sm font-medium text-ink">
          Comment
        </label>
        <textarea
          id="comment-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={MAX_COMMENT_BODY_LENGTH}
          className="w-full rounded-xl border-[1.5px] border-border-subtle bg-card px-3.5 py-2.5 text-[15px] text-ink placeholder:text-faint transition focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-primary transition hover:bg-primary-hover disabled:opacity-50"
      >
        {submitting ? "Posting..." : "Post Comment"}
      </button>
    </form>
  );
}
