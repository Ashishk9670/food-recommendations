"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-6xl">😕</p>
      <h1 className="mt-4 text-3xl font-bold text-stone-900">Something went wrong</h1>
      <p className="mt-2 text-stone-500">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-orange-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-orange-700"
      >
        Try again
      </button>
    </div>
  );
}
