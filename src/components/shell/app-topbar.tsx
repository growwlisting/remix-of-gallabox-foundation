import { Search, Sparkles, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "./breadcrumbs";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "./user-menu";
import { NotificationCenter } from "./notification-center";
import { useCopilot } from "./copilot-provider";

export function AppTopbar({ onOpenCommand }: { onOpenCommand: () => void }) {
  const { toggle: toggleCopilot, open: copilotOpen } = useCopilot();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/70 bg-background/70 px-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55 sm:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 hidden h-5 sm:block" />
      <div className="hidden min-w-0 flex-1 md:flex">
        <Breadcrumbs />
      </div>
      <div className="flex flex-1 items-center justify-end gap-1.5 md:flex-none">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCommand}
          className="group hidden h-9 w-72 justify-start gap-2 rounded-lg border-border/70 bg-muted/40 px-3 text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted hover:text-foreground hover:shadow-[var(--shadow-soft)] lg:flex"
        >
          <Search className="h-4 w-4 transition-colors group-hover:text-primary" />
          <span className="truncate text-sm">
            Search<span className="text-muted-foreground/70"> or </span>
            <span className="brand-text font-medium">ask AI</span>
          </span>
          <kbd className="ml-auto inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </Button>
        <Button variant="ghost" size="icon" onClick={onOpenCommand} aria-label="Search" className="lg:hidden">
          <Search className="h-4 w-4" />
        </Button>
        <NotificationCenter />
        <ThemeToggle />
        <Button
          variant={copilotOpen ? "secondary" : "ghost"}
          size="icon"
          onClick={toggleCopilot}
          aria-label="Toggle AI Copilot"
          className="hidden lg:inline-flex"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleCopilot} aria-label="Open Copilot" className="lg:hidden">
          <PanelRight className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block" />
        <UserMenu />
      </div>
    </header>
  );
}
