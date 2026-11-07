export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-4xl animate-pulse px-4 py-8">
      <div className="mb-6 h-8 w-56 rounded bg-card-muted" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-border-subtle bg-card p-3"
          >
            <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-card-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-card-muted" />
              <div className="h-3 w-1/4 rounded bg-card-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
