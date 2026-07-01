import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred while loading this view. You can try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-8 py-16 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button onClick={onRetry} variant="outline" className="mt-6">
          <RotateCcw className="mr-2 h-4 w-4" /> Try again
        </Button>
      ) : null}
    </div>
  );
}
