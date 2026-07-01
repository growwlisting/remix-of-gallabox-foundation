import { Skeleton } from "@/components/ui/skeleton";

type Variant = "default" | "dashboard" | "table" | "kanban" | "grid" | "columns";

export function PageSkeleton({ variant = "default" }: { variant?: Variant }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {variant === "dashboard" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
          <div className="grid gap-4 lg:grid-cols-5">
            <Skeleton className="h-64 rounded-xl lg:col-span-3" />
            <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          </div>
        </>
      )}

      {variant === "table" && (
        <>
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="space-y-2 rounded-xl border border-border p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </>
      )}

      {variant === "kanban" && (
        <div className="flex gap-4 overflow-x-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex min-w-[260px] flex-col gap-3 rounded-xl border border-border bg-card/60 p-3">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 3 }).map((__, j) => (
                <Skeleton key={j} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      )}

      {variant === "grid" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      )}

      {variant === "columns" && (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr_360px]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      )}

      {variant === "default" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl md:col-span-2" />
        </div>
      )}
    </div>
  );
}

export function LoadingGate({
  variant = "default",
  children,
  ms = 800,
}: {
  variant?: Variant;
  children: React.ReactNode;
  ms?: number;
}) {
  // Local import to keep hook usage colocated
  const loading = useLoading(ms);
  if (loading) return <PageSkeleton variant={variant} />;
  return <>{children}</>;
}

// re-export via internal hook to keep import surface tidy
import { useMountLoading as useLoading } from "@/hooks/use-mount-loading";

export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  variant: Variant = "default",
  ms = 800,
) {
  return function LoadingWrapped(props: P) {
    const loading = useLoading(ms);
    if (loading) return <PageSkeleton variant={variant} />;
    return <Component {...props} />;
  };
}
