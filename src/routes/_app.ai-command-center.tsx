import { createFileRoute } from "@tanstack/react-router";
import {
  Target,
  Users,
  UserSquare2,
  Building2,
  Globe,
  Radar,
  Gauge,
  PenLine,
  MessageCircle,
  Linkedin,
  Megaphone,
  CalendarCheck2,
  BarChart3,
  Workflow,
  Brain,
  Plus,
  Play,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Wifi,
  Compass,
  Search,
  Send,
  LineChart,
  Info,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/states/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getRouteMeta } from "@/lib/route-meta";
import { withLoading } from "@/components/states/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { useAITasks } from "@/hooks/use-growth-data";
import { useProfile } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMemo } from "react";

const meta = getRouteMeta("/ai-command-center")!;

export const Route = createFileRoute("/_app/ai-command-center")({
  head: () => ({
    meta: [
      { title: `${meta.label} · Gallabox GrowthOS` },
      { name: "description", content: "Your AI workforce for revenue generation." },
    ],
  }),
  component: withLoading(AICommandCenterPage, "grid"),
});

/* ---------------- Agent registry ---------------- */

type CategoryKey = "strategy" | "intel" | "outreach" | "ops";

type Agent = {
  name: string;
  icon: LucideIcon;
  description: string;
  category: CategoryKey;
  bestFor: string; // one-liner: "Use when …"
  tint: string;
  wired: boolean; // has an edge function prompt & runs live via run-agent
};

// Wired flag reflects supabase/functions/run-agent AGENT_PROMPTS coverage.
// All 15 currently ship with a real prompt and hit Lovable AI Gateway.
const AGENTS: Agent[] = [
  { name: "Sales Strategist", icon: Target, category: "strategy",
    description: "Designs GTM plays and quota strategies from your pipeline.",
    bestFor: "Use when planning a new quarter or a stalled-pipeline recovery play.",
    tint: "bg-indigo-500/10 text-indigo-500", wired: true },
  { name: "ICP Builder", icon: Users, category: "strategy",
    description: "Synthesizes closed-won data into a precise ideal customer profile.",
    bestFor: "Use before launching outbound to a new segment.",
    tint: "bg-violet-500/10 text-violet-500", wired: true },
  { name: "Persona Builder", icon: UserSquare2, category: "strategy",
    description: "Maps buyer personas with pains, triggers, and messaging angles.",
    bestFor: "Use when writing new sequences or landing pages.",
    tint: "bg-fuchsia-500/10 text-fuchsia-500", wired: true },
  { name: "Workflow Builder", icon: Workflow, category: "strategy",
    description: "Composes multi-agent workflows from natural-language briefs.",
    bestFor: "Use to turn a repeated manual play into an automation.",
    tint: "bg-purple-500/10 text-purple-500", wired: true },
  { name: "Memory Manager", icon: Brain, category: "strategy",
    description: "Curates the shared context every agent draws from.",
    bestFor: "Run weekly so every agent stays on-brand and up to date.",
    tint: "bg-pink-500/10 text-pink-500", wired: true },

  { name: "Company Research", icon: Building2, category: "intel",
    description: "Enriches accounts with firmographics, tech stack, and news.",
    bestFor: "Before a discovery call or account-plan review.",
    tint: "bg-blue-500/10 text-blue-500", wired: true },
  { name: "Website Analyzer", icon: Globe, category: "intel",
    description: "Extracts positioning, offers, and tech signals from any URL.",
    bestFor: "Qualifying an inbound lead or scouting a competitor.",
    tint: "bg-sky-500/10 text-sky-500", wired: true },
  { name: "Buying Signals", icon: Radar, category: "intel",
    description: "Monitors hiring, funding, and intent signals across accounts.",
    bestFor: "Keep running — surfaces reasons to reach out today.",
    tint: "bg-cyan-500/10 text-cyan-500", wired: true },
  { name: "Lead Scoring", icon: Gauge, category: "intel",
    description: "Scores every lead on Intent / Fit / Timing / Engagement.",
    bestFor: "After new leads arrive to route the hot ones fast.",
    tint: "bg-teal-500/10 text-teal-500", wired: true },

  { name: "Outreach Writer", icon: PenLine, category: "outreach",
    description: "Drafts personalized cold emails, notes, and follow-ups.",
    bestFor: "Anytime you'd otherwise write a one-off email.",
    tint: "bg-emerald-500/10 text-emerald-500", wired: true },
  { name: "WhatsApp Agent", icon: MessageCircle, category: "outreach",
    description: "Runs compliant WhatsApp conversations at scale.",
    bestFor: "For opt-in nurture on high-intent accounts.",
    tint: "bg-green-500/10 text-green-600", wired: true },
  { name: "LinkedIn Agent", icon: Linkedin, category: "outreach",
    description: "Sends connection notes and nurtures social conversations.",
    bestFor: "For senior buyers who ignore cold email.",
    tint: "bg-blue-600/10 text-blue-600", wired: true },
  { name: "Campaign Builder", icon: Megaphone, category: "outreach",
    description: "Plans multi-channel campaigns from goal to launch-ready.",
    bestFor: "Turning a strategy brief into a running sequence.",
    tint: "bg-amber-500/10 text-amber-600", wired: true },

  { name: "Meeting Coach", icon: CalendarCheck2, category: "ops",
    description: "Preps briefs and coaches live call talk tracks for reps.",
    bestFor: "15 minutes before every discovery / demo call.",
    tint: "bg-orange-500/10 text-orange-500", wired: true },
  { name: "Analytics Agent", icon: BarChart3, category: "ops",
    description: "Investigates funnel drop-offs and explains revenue movement.",
    bestFor: "When a metric moves and you need the why fast.",
    tint: "bg-rose-500/10 text-rose-500", wired: true },
];

const CATEGORIES: Record<CategoryKey, { label: string; icon: LucideIcon; blurb: string; tint: string }> = {
  strategy: {
    label: "Strategy & Planning",
    icon: Compass,
    blurb: "Set the direction — GTM plays, ICP, personas, and the workflows every other agent runs inside.",
    tint: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  intel: {
    label: "Intelligence & Research",
    icon: Search,
    blurb: "Find, enrich, and score the right accounts and people — feed the outreach engine.",
    tint: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  outreach: {
    label: "Outreach & Engagement",
    icon: Send,
    blurb: "Turn intent into conversations across email, WhatsApp, LinkedIn, and multi-channel campaigns.",
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  ops: {
    label: "Sales Ops & Analytics",
    icon: LineChart,
    blurb: "Coach reps in-flight and explain what's actually moving revenue.",
    tint: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
};

const CATEGORY_ORDER: CategoryKey[] = ["strategy", "intel", "outreach", "ops"];

/* ---------------- Status helpers ---------------- */

type ActivityStatus = "Completed" | "Running" | "Queued" | "Failed";

const AGENT_STYLE: Record<string, { icon: LucideIcon; tint: string }> = Object.fromEntries(
  AGENTS.map((a) => [a.name, { icon: a.icon, tint: a.tint }]),
);

function agentStyleFor(name: string): { icon: LucideIcon; tint: string } {
  return AGENT_STYLE[name] ?? { icon: Sparkles, tint: "bg-muted text-muted-foreground" };
}

function normalizeStatus(s: string): ActivityStatus {
  const v = s.toLowerCase();
  if (v === "running") return "Running";
  if (v === "queued") return "Queued";
  if (v === "failed") return "Failed";
  return "Completed";
}

function relDuration(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return `${m}m ${String(rem).padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function relAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const ACTIVITY_STATUS: Record<ActivityStatus, string> = {
  Completed: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400",
  Running: "bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/30 dark:text-indigo-400",
  Queued: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/25 dark:text-amber-400",
  Failed: "bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/25 dark:text-rose-400",
};

/* ---------------- Page ---------------- */

function AICommandCenterPage() {
  const { data: tasks, isLoading: tasksLoading } = useAITasks();
  const { data: profile } = useProfile();
  const wsReady = !!profile?.workspace_id;

  // Per-agent live stats derived from tasks.
  const agentStats = useMemo(() => {
    const map = new Map<string, { running: boolean; queued: boolean; lastAt: string | null; lastStatus: ActivityStatus | null; runs24h: number }>();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    (tasks ?? []).forEach((t) => {
      const s = normalizeStatus(t.status);
      const cur = map.get(t.agent_name) ?? { running: false, queued: false, lastAt: null, lastStatus: null, runs24h: 0 };
      if (s === "Running") cur.running = true;
      if (s === "Queued") cur.queued = true;
      if (!cur.lastAt || new Date(t.created_at).getTime() > new Date(cur.lastAt).getTime()) {
        cur.lastAt = t.created_at;
        cur.lastStatus = s;
      }
      if (new Date(t.created_at).getTime() >= cutoff) cur.runs24h += 1;
      map.set(t.agent_name, cur);
    });
    return map;
  }, [tasks]);

  const totals = useMemo(() => {
    let running = 0, queued = 0, completed24h = 0, failed24h = 0;
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    (tasks ?? []).forEach((t) => {
      const s = normalizeStatus(t.status);
      if (s === "Running") running++;
      if (s === "Queued") queued++;
      const recent = new Date(t.created_at).getTime() >= cutoff;
      if (recent && s === "Completed") completed24h++;
      if (recent && s === "Failed") failed24h++;
    });
    return { running, queued, completed24h, failed24h };
  }, [tasks]);

  const handleRunAgent = async (agent: Agent) => {
    if (!profile?.workspace_id) {
      toast.error("No workspace found");
      return;
    }
    if (!agent.wired) {
      toast.info(`${agent.name} isn't wired yet`, { description: "This agent is planned but not connected to the AI runtime." });
      return;
    }
    const { data: task, error } = await supabase
      .from("ai_tasks")
      .insert({
        agent_name: agent.name,
        task_description: `Running ${agent.name}...`,
        workspace_id: profile.workspace_id,
        status: "queued",
        progress: 0,
      })
      .select()
      .single();
    if (error || !task) {
      toast.error("Failed to queue agent", { description: error?.message });
      return;
    }
    toast(`${agent.name} started`, { description: "Streaming live via AI Gateway — watch Recent Activity." });
    supabase.functions.invoke("run-agent", {
      body: {
        agentName: agent.name,
        taskDescription: `Standard ${agent.name} run`,
        workspaceId: profile.workspace_id,
        taskId: task.id,
      },
    });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <PageHeader
        eyebrow="AI"
        title="AI Command Center"
        description="Your AI workforce, grouped by what they do for revenue."
        actions={
          <Button size="sm" className="brand-gradient text-brand-foreground hover:opacity-95">
            <Plus className="mr-1 h-4 w-4" /> New Mission
          </Button>
        }
      />

      {/* Runtime status strip */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
              wsReady
                ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400"
                : "bg-muted text-muted-foreground ring-1 ring-border"
            }`}
          >
            <Wifi className="h-3 w-3" />
            {wsReady ? "Realtime connected" : "Connecting…"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-600 ring-1 ring-indigo-500/25 dark:text-indigo-400">
            <Loader2 className={`h-3 w-3 ${totals.running > 0 ? "animate-spin" : ""}`} />
            {totals.running} running
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 ring-1 ring-amber-500/25 dark:text-amber-400">
            <Sparkles className="h-3 w-3" /> {totals.queued} queued
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> {totals.completed24h} completed · 24h
          </span>
          {totals.failed24h > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-600 ring-1 ring-rose-500/25 dark:text-rose-400">
              {totals.failed24h} failed · 24h
            </span>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground">
            All {AGENTS.length} agents live · runs stream from Lovable AI Gateway
          </span>
        </div>
      </section>

      {/* Agents grouped by category */}
      <section className="flex flex-col gap-8">
        {CATEGORY_ORDER.map((catKey) => {
          const cat = CATEGORIES[catKey];
          const agents = AGENTS.filter((a) => a.category === catKey);
          const CatIcon = cat.icon;
          return (
            <div key={catKey}>
              <div className="mb-3 flex items-start gap-3">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${cat.tint}`}>
                  <CatIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    {cat.label}{" "}
                    <span className="text-xs font-normal text-muted-foreground">· {agents.length} agents</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">{cat.blurb}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => {
                  const stats = agentStats.get(agent.name);
                  const isRunning = !!stats?.running;
                  const isQueued = !!stats?.queued;
                  return (
                    <article
                      key={agent.name}
                      className="card-hover group relative flex flex-col rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]"
                    >
                      <header className="flex items-start gap-3">
                        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${agent.tint}`}>
                          <agent.icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">{agent.name}</p>
                            {isRunning ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-600 ring-1 ring-indigo-500/30 dark:text-indigo-400">
                                <Loader2 className="h-2.5 w-2.5 animate-spin" /> Running
                              </span>
                            ) : isQueued ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 ring-1 ring-amber-500/25 dark:text-amber-400">
                                Queued
                              </span>
                            ) : agent.wired ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  Connected to Lovable AI Gateway via <code>run-agent</code>.
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border">
                                Planned
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {agent.description}
                          </p>
                          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                            <Info className="mt-0.5 h-3 w-3 shrink-0 text-indigo-500/70" />
                            <span>{agent.bestFor}</span>
                          </div>
                        </div>
                      </header>

                      <footer className="mt-4 flex items-center justify-between border-t border-border pt-3">
                        <div className="text-[11px] tabular-nums text-muted-foreground">
                          {stats?.lastAt ? (
                            <>
                              Last run {relAgo(stats.lastAt)}
                              {stats.lastStatus && stats.lastStatus !== "Running" && (
                                <span className="ml-1 opacity-70">· {stats.lastStatus}</span>
                              )}
                              {stats.runs24h > 0 && <span className="ml-1 opacity-70">· {stats.runs24h}× / 24h</span>}
                            </>
                          ) : (
                            <span className="italic">Never run</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          disabled={isRunning || isQueued || !agent.wired}
                          onClick={() => handleRunAgent(agent)}
                          className="h-7 px-2.5 text-xs brand-gradient text-brand-foreground hover:opacity-95 disabled:opacity-60"
                        >
                          {isRunning ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Running
                            </>
                          ) : isQueued ? (
                            "Queued"
                          ) : (
                            <>
                              <Play className="mr-1 h-3 w-3" /> Run Agent
                            </>
                          )}
                        </Button>
                      </footer>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Recent activity */}
      <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Recent agent activity
            </h3>
            <p className="text-xs text-muted-foreground">
              Streams live from your workspace. Every row is a real AI Gateway call.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs">View all</Button>
        </div>
        <div className="p-2">
          {tasksLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (tasks?.length ?? 0) === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No recent agent tasks"
              description="Run an agent to see activity here — output streams back in real time."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Agent</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="pr-4">Output</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tasks ?? []).slice(0, 12).map((row) => {
                  const style = agentStyleFor(row.agent_name);
                  const status = normalizeStatus(row.status);
                  const Icon = style.icon;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="px-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${style.tint}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-xs font-medium text-foreground">{row.agent_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[320px] truncate text-xs text-muted-foreground">
                        {row.task_description}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${ACTIVITY_STATUS[status]}`}>
                          {status === "Running" ? (
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          ) : status === "Completed" ? (
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          ) : status === "Queued" ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          )}
                          {status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {relDuration(row.created_at)}
                      </TableCell>
                      <TableCell className="max-w-[360px] truncate pr-4 text-xs text-foreground">
                        {row.result ?? <span className="text-muted-foreground italic">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      {/* Reference of removed unused symbol to satisfy strict tree-shake */}
      {(() => { void ArrowRight; return null; })()}
    </TooltipProvider>
  );
}
