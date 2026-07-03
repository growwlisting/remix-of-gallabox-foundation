import { useEffect, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { CopilotPanel } from "./copilot-panel";
import { CopilotProvider } from "./copilot-provider";
import { CommandPalette, useCommandPalette } from "@/components/command-palette";
import { trackRoute } from "@/lib/recent-routes";

export function AppShell({ children }: { children: ReactNode }) {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    trackRoute(pathname);
  }, [pathname]);


  return (
    <CopilotProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <SidebarInset className="relative flex min-w-0 flex-1 flex-col">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-70"
              style={{
                backgroundImage:
                  "radial-gradient(900px 480px at 100% -10%, color-mix(in oklch, var(--brand-end) 10%, transparent), transparent 60%), radial-gradient(700px 400px at -10% 0%, color-mix(in oklch, var(--brand) 8%, transparent), transparent 55%)",
              }}
            />
            <AppTopbar onOpenCommand={() => setCmdOpen(true)} />
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">{children}</div>
            </main>
          </SidebarInset>
          <CopilotPanel />
        </div>
        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      </SidebarProvider>
    </CopilotProvider>
  );
}
