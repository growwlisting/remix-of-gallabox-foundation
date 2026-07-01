import { Skeleton } from "@/components/ui/skeleton";

function ShimmerCard({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-soft)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 ai-shimmer" aria-hidden />
      <div className="relative">{children}</div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <ShimmerCard className="p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-md" />
      </div>
      <Skeleton className="mt-5 h-7 w-32" />
      <div className="mt-3 flex items-center gap-2">
        <Skeleton className="h-2 w-12 rounded-full" />
        <Skeleton className="h-2 w-16 rounded-full" />
      </div>
    </ShimmerCard>
  );
}

export function SkeletonCard() {
  return (
    <ShimmerCard className="p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-5/6" />
        <Skeleton className="h-2.5 w-4/6" />
      </div>
    </ShimmerCard>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <ShimmerCard key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-2.5 w-1/3" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-2.5 w-16" />
        </ShimmerCard>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <ShimmerCard>
      <div className="border-b border-border bg-muted/40 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-2.5 w-2/3" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-2.5 w-full" />
            ))}
          </div>
        ))}
      </div>
    </ShimmerCard>
  );
}
