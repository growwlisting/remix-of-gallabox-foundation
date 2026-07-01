import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { ROUTE_META, NAV_GROUPS, getRouteMeta } from "@/lib/route-meta";
import { useTheme } from "@/lib/theme-provider";
import { useCopilot } from "@/components/shell/copilot-provider";
import { useSidebar } from "@/components/ui/sidebar";
import { useRecentRoutes } from "@/lib/recent-routes";
import {
  Moon,
  Sun,
  Monitor,
  Sparkles,
  PanelLeft,
  BookOpen,
  Zap,
  Clock,
  ArrowRight,
  Target,
  Send,
  Megaphone,
  Activity,
  Search as SearchIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

const AI_ACTIONS: Array<{ label: string; icon: LucideIcon }> = [
  { label: "Run lead enrichment", icon: Zap },
  { label: "Draft outreach for top lead", icon: Send },
  { label: "Launch re-engagement campaign", icon: Megaphone },
  { label: "Analyze pipeline health", icon: Activity },
  { label: "Find ICP matches today", icon: SearchIcon },
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { toggle: toggleCopilot } = useCopilot();
  const { toggleSidebar } = useSidebar();
  const recent = useRecentRoutes();

  const run = (fn: () => void) => {
    onOpenChange(false);
    setTimeout(fn, 0);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search or ask AI…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="AI Actions">
          {AI_ACTIONS.map((a) => (
            <CommandItem
              key={a.label}
              value={`ai ${a.label}`}
              onSelect={() =>
                run(() => {
                  toast(`Running: ${a.label}…`, {
                    description: "Copilot is on it. You'll be notified when done.",
                  });
                })
              }
            >
              <a.icon className="mr-2 h-4 w-4 text-primary" />
              <span>{a.label}</span>
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
            </CommandItem>
          ))}
        </CommandGroup>

        {recent.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent">
              {recent.slice(0, 3).map((path) => {
                const meta = getRouteMeta(path);
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <CommandItem
                    key={path}
                    value={`recent ${meta.label}`}
                    onSelect={() => run(() => navigate({ to: path }))}
                  >
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{meta.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        {NAV_GROUPS.map((group) => (
          <CommandGroup key={group.label} heading={`Navigation · ${group.label}`}>
            {group.items.map((item) => (
              <CommandItem
                key={item.path}
                value={`nav ${item.label} ${item.description}`}
                onSelect={() => run(() => navigate({ to: item.path }))}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(toggleSidebar)}>
            <PanelLeft className="mr-2 h-4 w-4" /> Toggle sidebar
          </CommandItem>
          <CommandItem onSelect={() => run(toggleCopilot)}>
            <Sparkles className="mr-2 h-4 w-4" /> Toggle AI Copilot
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" /> Theme: Light
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" /> Theme: Dark
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("system"))}>
            <Monitor className="mr-2 h-4 w-4" /> Theme: System
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Help">
          <CommandItem onSelect={() => run(() => toast.info("Documentation coming soon"))}>
            <BookOpen className="mr-2 h-4 w-4" /> Open documentation
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return { open, setOpen };
}
