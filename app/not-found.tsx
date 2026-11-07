import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-6xl">🍽️</p>
      <h1 className="mt-4 text-3xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 text-muted">
        We couldn&apos;t find the page you were looking for.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary shadow-primary transition hover:bg-primary-hover"
      >
        Browse Recommendations
      </Link>
    </div>
  );
}
