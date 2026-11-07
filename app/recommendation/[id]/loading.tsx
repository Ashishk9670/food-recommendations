export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl animate-pulse px-4 py-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="aspect-[4/3] w-full rounded-2xl bg-card-muted" />
        <div className="space-y-3">
          <div className="h-7 w-2/3 rounded bg-card-muted" />
          <div className="h-4 w-1/3 rounded bg-card-muted" />
          <div className="h-5 w-1/4 rounded bg-card-muted" />
          <div className="h-16 w-full rounded bg-card-muted" />
        </div>
      </div>
      <div className="mt-10 space-y-4">
        <div className="h-6 w-40 rounded bg-card-muted" />
        <div className="h-16 w-full rounded-lg bg-card-muted" />
      </div>
    </div>
  );
}
