import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { ErrorState } from "@/components/states/error-state";
import { reportLovableError } from "@/lib/lovable-error-reporting";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
  errorComponent: AppErrorComponent,
});

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function AppErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    reportLovableError(error, { boundary: "app_layout" });
  }, [error]);
  return (
    <AppShell>
      <ErrorState onRetry={reset} description={error.message || "An unexpected error interrupted this view."} />
    </AppShell>
  );
}
