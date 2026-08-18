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
        <label htmlFor="comment-author" className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          Your name <span className="text-stone-400 dark:text-stone-500">(optional)</span>
        </label>
        <input
          id="comment-author"
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={MAX_COMMENT_AUTHOR_NAME_LENGTH}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-orange-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
      </div>
      <div>
        <label htmlFor="comment-body" className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          Comment
        </label>
        <textarea
          id="comment-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={MAX_COMMENT_BODY_LENGTH}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-orange-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
      >
        {submitting ? "Posting..." : "Post Comment"}
      </button>
    </form>
  );
}
