export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
      <p className="font-serif text-sm text-muted-foreground animate-pulse">
        Memuat Nombokin...
      </p>
    </div>
  );
}
