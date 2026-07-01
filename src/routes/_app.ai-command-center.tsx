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
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/states/page-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRouteMeta } from "@/lib/route-meta";
import { withLoading } from "@/components/states/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { useAITasks } from "@/hooks/use-growth-data";

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

type AgentStatus = "Ready" | "Running" | "Idle";

type Agent = {
  name: string;
  icon: LucideIcon;
  description: string;
  status: AgentStatus;
  tint: string; // icon container classes
};

const AGENTS: Agent[] = [
  { name: "Sales Strategist", icon: Target, description: "Designs GTM plays and quota strategies from your pipeline.", status: "Ready", tint: "bg-indigo-500/10 text-indigo-500" },
  { name: "ICP Builder", icon: Users, description: "Synthesizes closed-won data into a precise ideal customer profile.", status: "Ready", tint: "bg-violet-500/10 text-violet-500" },
  { name: "Persona Builder", icon: UserSquare2, description: "Maps buyer personas with pains, triggers, and messaging angles.", status: "Idle", tint: "bg-fuchsia-500/10 text-fuchsia-500" },
  { name: "Company Research", icon: Building2, description: "Enriches accounts with firmographics, tech stack, and news.", status: "Running", tint: "bg-blue-500/10 text-blue-500" },
  { name: "Website Analyzer", icon: Globe, description: "Extracts positioning, offers, and tech signals from any URL.", status: "Ready", tint: "bg-sky-500/10 text-sky-500" },
  { name: "Buying Signals", icon: Radar, description: "Monitors hiring, funding, and intent signals across accounts.", status: "Running", tint: "bg-cyan-500/10 text-cyan-500" },
  { name: "Lead Scoring", icon: Gauge, description: "Scores every lead against your ICP and live buying intent.", status: "Ready", tint: "bg-teal-500/10 text-teal-500" },
  { name: "Outreach Writer", icon: PenLine, description: "Drafts personalized cold emails, notes, and follow-ups.", status: "Running", tint: "bg-emerald-500/10 text-emerald-500" },
  { name: "WhatsApp Agent", icon: MessageCircle, description: "Runs compliant WhatsApp conversations at scale.", status: "Ready", tint: "bg-green-500/10 text-green-600" },
  { name: "LinkedIn Agent", icon: Linkedin, description: "Sends connection notes and nurtures social conversations.", status: "Idle", tint: "bg-blue-600/10 text-blue-600" },
  { name: "Campaign Builder", icon: Megaphone, description: "Plans multi-channel campaigns from goal to launch-ready.", status: "Ready", tint: "bg-amber-500/10 text-amber-600" },
  { name: "Meeting Coach", icon: CalendarCheck2, description: "Preps briefs and coaches live call talk tracks for reps.", status: "Ready", tint: "bg-orange-500/10 text-orange-500" },
  { name: "Analytics Agent", icon: BarChart3, description: "Investigates funnel drop-offs and explains revenue movement.", status: "Idle", tint: "bg-rose-500/10 text-rose-500" },
  { name: "Workflow Builder", icon: Workflow, description: "Composes multi-agent workflows from natural-language briefs.", status: "Ready", tint: "bg-purple-500/10 text-purple-500" },
  { name: "Memory Manager", icon: Brain, description: "Curates the shared context every agent draws from.", status: "Ready", tint: "bg-pink-500/10 text-pink-500" },
];

const STATUS_BADGE: Record<AgentStatus, string> = {
  Ready: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400",
  Running: "bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/30 dark:text-indigo-400",
  Idle: "bg-muted text-muted-foreground ring-1 ring-border",
};

function StatusBadge({ status }: { status: AgentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[status]}`}
    >
      {status === "Running" ? (
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
      ) : status === "Ready" ? (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
      )}
      {status}
    </span>
  );
}

type ActivityStatus = "Completed" | "Running" | "Failed";

const AGENT_STYLE: Record<string, { icon: LucideIcon; tint: string }> = {
  "Company Research": { icon: Building2, tint: "bg-blue-500/10 text-blue-500" },
  "Outreach Writer": { icon: PenLine, tint: "bg-emerald-500/10 text-emerald-500" },
  "Buying Signals": { icon: Radar, tint: "bg-cyan-500/10 text-cyan-500" },
  "Lead Scoring": { icon: Gauge, tint: "bg-teal-500/10 text-teal-500" },
  "Meeting Coach": { icon: CalendarCheck2, tint: "bg-orange-500/10 text-orange-500" },
};

function agentStyleFor(name: string): { icon: LucideIcon; tint: string } {
  return AGENT_STYLE[name] ?? { icon: Sparkles, tint: "bg-muted text-muted-foreground" };
}

function normalizeStatus(s: string): ActivityStatus {
  const v = s.toLowerCase();
  if (v === "running") return "Running";
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

const ACTIVITY_STATUS: Record<ActivityStatus, string> = {
  Completed: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400",
  Running: "bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/30 dark:text-indigo-400",
  Failed: "bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/25 dark:text-rose-400",
};

function AICommandCenterPage() {
  const { data: tasks, isLoading: tasksLoading } = useAITasks();
  const completed = 5;
  const total = 18;
  const progress = (completed / total) * 100;


  return (
    <>
      <PageHeader
        eyebrow="AI"
        title="AI Command Center"
        description="Your AI workforce for revenue generation."
        actions={
          <Button size="sm" className="brand-gradient text-brand-foreground hover:opacity-95">
            <Plus className="mr-1 h-4 w-4" /> New Mission
          </Button>
        }
      />

      {/* Active mission banner */}
      <section className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white shadow-[var(--shadow-elevated)]">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/90 ring-1 ring-white/25 backdrop-blur">
              <span className="relative grid h-1.5 w-1.5 place-items-center">
                <span className="absolute inset-0 rounded-full bg-white ai-pulse" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              Active mission
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
              Re-engage 18 stalled enterprise deals before Friday
            </h2>
            <div className="mt-4 max-w-2xl">
              <div className="flex items-center justify-between text-xs font-medium text-white/85">
                <span>Progress</span>
                <span className="tabular-nums">
                  {completed} / {total} complete
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white ring-1 ring-white/25">
                <CheckCircle2 className="h-3 w-3" /> 5 completed
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white ring-1 ring-white/25">
                <Loader2 className="h-3 w-3 animate-spin" /> 2 in progress
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white ring-1 ring-white/25">
                <Sparkles className="h-3 w-3" /> 11 queued
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/15 hover:text-white"
            >
              View Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Agents grid */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">AI Agents</h3>
            <p className="text-sm text-muted-foreground">
              Your always-on workforce. Deploy an agent or compose new ones.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Manage roster <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent) => (
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
                    <StatusBadge status={agent.status} />
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {agent.description}
                  </p>
                </div>
              </header>
              <footer className="mt-4 flex items-center justify-end border-t border-border pt-3">
                <Button
                  size="sm"
                  className="h-7 px-2.5 text-xs opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 brand-gradient text-brand-foreground hover:opacity-95"
                >
                  <Play className="mr-1 h-3 w-3" /> Run Agent
                </Button>
              </footer>
            </article>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Recent agent activity
            </h3>
            <p className="text-xs text-muted-foreground">
              The latest tasks completed or in-flight across your workforce.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View all
          </Button>
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
              description="Run an agent to see activity here."
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
                {(tasks ?? []).map((row) => {
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
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          )}
                          {status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {relDuration(row.created_at)}
                      </TableCell>
                      <TableCell className="pr-4 text-xs text-foreground">{row.result}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </>
  );
}

