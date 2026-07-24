import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-6xl">🍽️</p>
      <h1 className="mt-4 text-3xl font-bold text-stone-900">Page not found</h1>
      <p className="mt-2 text-stone-500">
        We couldn&apos;t find the page you were looking for.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-orange-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-orange-700"
      >
        Browse Recommendations
      </Link>
    </div>
  );
}
