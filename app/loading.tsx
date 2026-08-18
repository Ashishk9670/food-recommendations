export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl animate-pulse px-4 py-8">
      <div className="mb-6 space-y-4">
        <div className="h-8 w-64 rounded bg-stone-200 dark:bg-stone-800" />
        <div className="h-10 w-full rounded-lg bg-stone-200 dark:bg-stone-800" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-stone-200 dark:bg-stone-800" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-orange-100 bg-white dark:border-stone-800 dark:bg-stone-900">
            <div className="aspect-[4/3] w-full bg-stone-200 dark:bg-stone-800" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded bg-stone-200 dark:bg-stone-800" />
              <div className="h-3 w-1/2 rounded bg-stone-200 dark:bg-stone-800" />
              <div className="h-3 w-1/3 rounded bg-stone-200 dark:bg-stone-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
