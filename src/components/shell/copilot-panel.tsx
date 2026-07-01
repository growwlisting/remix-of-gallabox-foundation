import {
  Sparkles,
  X,
  ArrowRight,
  Target,
  Loader2,
  Lightbulb,
  TrendingUp,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useCopilot } from "./copilot-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { getContextForPath } from "@/lib/copilot-context";

const ACTIVE_TASKS = [
  { label: "Enriching 248 leads from latest import", progress: 64, eta: "≈ 3 min left" },
  { label: "Drafting follow-ups for stalled deals", progress: 32, eta: "≈ 6 min left" },
];

const INSIGHTS: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: TrendingUp,
    title: "Pipeline velocity is up 12%",
    body: "Mid-market segment closed 4 deals faster than last week's median.",
  },
  {
    icon: Lightbulb,
    title: "3 accounts show buying intent",
    body: "Acme Corp, Northwind, and Lumen visited pricing pages this week.",
  },
];

function CopilotBody() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const ctx = getContextForPath(path);

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-5 py-4">
          {/* Page context */}
          <section className="rounded-xl border border-primary/25 bg-gradient-to-br from-accent/40 to-transparent p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/15 text-primary">
                <ctx.icon className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                On this page · {ctx.label}
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ctx.summary}</p>
            <div className="mt-3 space-y-1.5">
              {ctx.actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  className="group flex w-full items-center gap-2 rounded-md border border-border bg-card/80 px-2.5 py-2 text-left text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-card hover:shadow-[var(--shadow-soft)]"
                >
                  <a.icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{a.label}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              ))}
            </div>
          </section>

          {/* Today's Mission */}
          <section className="rounded-xl border border-copilot-border bg-card p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md brand-gradient text-brand-foreground">
                <Target className="h-3.5 w-3.5" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Today's Mission
              </p>
            </div>
            <h3 className="mt-3 text-sm font-semibold leading-snug text-foreground">
              Re-engage 18 stalled enterprise deals before Friday
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Copilot prepared a prioritized list and drafted personalized openers for each account.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Progress value={28} className="h-1.5 flex-1" />
              <span className="text-[11px] font-medium text-muted-foreground">5 / 18</span>
            </div>
            <Button size="sm" className="mt-3 h-8 w-full brand-gradient text-brand-foreground hover:opacity-95">
              Review mission
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </section>

          {/* Active AI Tasks */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Active AI Tasks
              </p>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                {ACTIVE_TASKS.length} running
              </span>
            </div>
            <div className="space-y-2">
              {ACTIVE_TASKS.map((t) => (
                <div
                  key={t.label}
                  className="rounded-lg border border-border bg-card/70 p-3 shadow-[var(--shadow-soft)] card-hover"
                >
                  <div className="flex items-start gap-2">
                    <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
                    <p className="min-w-0 flex-1 text-xs font-medium leading-snug text-foreground">{t.label}</p>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <Progress value={t.progress} className="h-1 flex-1" />
                    <span className="text-[10px] text-muted-foreground">{t.eta}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI Insights */}
          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              AI Insights
            </p>
            <div className="space-y-2">
              {INSIGHTS.map((i) => (
                <div
                  key={i.title}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-card/60 p-3 card-hover"
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                    <i.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-snug text-foreground">{i.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{i.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-success" />
            Grounded in your workspace data
          </div>
        </div>
      </ScrollArea>

      <div className="border-t border-copilot-border bg-copilot/60 p-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 shadow-[var(--shadow-soft)] transition-shadow focus-within:shadow-[var(--shadow-glow)]">
          <Sparkles className="h-4 w-4 text-primary" />
          <input
            disabled
            placeholder={ctx.placeholder}
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Your intelligent teammate · context-aware on every page
        </p>
      </div>
    </div>
  );
}

export function CopilotPanel() {
  const { open, setOpen } = useCopilot();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full max-w-md bg-copilot p-0 sm:max-w-md">
          <SheetHeader className="border-b border-copilot-border px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <div className="grid h-6 w-6 place-items-center rounded-md brand-gradient text-brand-foreground">
                <Sparkles className="h-3 w-3" />
              </div>
              AI Copilot
            </SheetTitle>
          </SheetHeader>
          <CopilotBody />
        </SheetContent>
      </Sheet>
    );
  }

  if (!open) return null;

  return (
    <aside className="hidden w-96 shrink-0 border-l border-copilot-border bg-copilot lg:flex lg:flex-col">
      <div className="flex h-14 items-center justify-between border-b border-copilot-border px-4">
        <div className="flex items-center gap-2.5">
          <div className="relative grid h-7 w-7 place-items-center rounded-md brand-gradient text-brand-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-success ai-pulse" aria-hidden />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-copilot-foreground">AI Copilot</p>
            <p className="text-[10px] text-muted-foreground">Your intelligent teammate</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close Copilot" className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <CopilotBody />
    </aside>
  );
}
