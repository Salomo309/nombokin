export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-48 animate-pulse rounded-md bg-secondary/80" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary/60" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-secondary/40" />
    </div>
  );
}
