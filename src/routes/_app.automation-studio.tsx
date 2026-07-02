import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pause,
  Play,
  Zap,
  Brain,
  GitBranch,
  ListChecks,
  Bell,
  ArrowDown,
  Bot,
  RefreshCcw,
  CalendarClock,
  AlertTriangle,
  MessageSquare,
  Link2,
  Loader2,
  Activity,
} from "lucide-react";

import { PageHeader } from "@/components/states/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRouteMeta } from "@/lib/route-meta";
import { withLoading } from "@/components/states/page-skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { useAITasks } from "@/hooks/use-growth-data";


const meta = getRouteMeta("/automation-studio")!;

export const Route = createFileRoute("/_app/automation-studio")({
  head: () => ({
    meta: [
      { title: `${meta.label} · Gallabox GrowthOS` },
      { name: "description", content: meta.description },
    ],
  }),
  component: withLoading(AutomationStudioPage, "grid"),
});

/* ------------------------------------------------------------------ */
/*  Active Workflows                                                    */
/* ------------------------------------------------------------------ */

interface WorkflowCard {
  id: string;
  name: string;
  status: "Active" | "Paused";
  metric: string;
  metricLabel: string;
  trigger: string;
  steps: number;
}

const WORKFLOWS: WorkflowCard[] = [
  {
    id: "1",
    name: "Lead Enrichment Pipeline",
    status: "Active",
    metric: "248",
    metricLabel: "leads processed today",
    trigger: "New lead added",
    steps: 4,
  },
  {
    id: "2",
    name: "Stalled Deal Re-engagement",
    status: "Active",
    metric: "18",
    metricLabel: "deals triggered",
    trigger: "No activity 14 days",
    steps: 6,
  },
  {
    id: "3",
    name: "ICP Signal Monitor",
    status: "Active",
    metric: "847",
    metricLabel: "companies monitored",
    trigger: "Daily at 9am",
    steps: 3,
  },
];

function ActiveWorkflowCard({
  workflow,
  onRun,
  isRunning,
}: {
  workflow: WorkflowCard;
  onRun: (name: string) => void;
  isRunning: boolean;
}) {
  return (
    <Card className="card-hover">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {workflow.name}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Active
            </span>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-2xl font-bold text-foreground">{workflow.metric}</p>
          <p className="text-xs text-muted-foreground">{workflow.metricLabel}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            <Zap className="mr-1 h-3 w-3" />
            {workflow.trigger}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            <ListChecks className="mr-1 h-3 w-3" />
            {workflow.steps} steps
          </Badge>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Pause className="h-3.5 w-3.5" />
            Pause
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isRunning}
            onClick={() => onRun(workflow.name)}
            className="h-8 gap-1.5 text-xs"
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Run Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


/* ------------------------------------------------------------------ */
/*  Workflow Builder — visual node flow                                 */
/* ------------------------------------------------------------------ */

const NODE_TYPES = {
  trigger: {
    border: "border-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    iconBg: "bg-indigo-500",
    icon: Zap,
  },
  action: {
    border: "border-sky-500",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    iconBg: "bg-sky-500",
    icon: Brain,
  },
  condition: {
    border: "border-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    iconBg: "bg-amber-500",
    icon: GitBranch,
  },
  actionGreen: {
    border: "border-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconBg: "bg-emerald-500",
    icon: ListChecks,
  },
  actionGray: {
    border: "border-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    iconBg: "bg-slate-400",
    icon: ListChecks,
  },
  actionPurple: {
    border: "border-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    iconBg: "bg-violet-500",
    icon: Bell,
  },
} as const;

type NodeTypeKey = keyof typeof NODE_TYPES;

function FlowNode({
  type,
  label,
  sublabel,
  isDiamond,
}: {
  type: NodeTypeKey;
  label: string;
  sublabel?: string;
  isDiamond?: boolean;
}) {
  const cfg = NODE_TYPES[type];
  const Icon = cfg.icon;

  if (isDiamond) {
    return (
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "relative flex h-20 w-20 rotate-45 items-center justify-center rounded-xl border-2",
            cfg.border,
            cfg.bg,
          )}
        >
          <div className="-rotate-45 flex flex-col items-center justify-center text-center">
            <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", cfg.iconBg)}>
              <Icon className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {sublabel ? <p className="text-xs text-muted-foreground">{sublabel}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border-l-4 p-4 shadow-sm",
        cfg.border,
        cfg.bg,
      )}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", cfg.iconBg)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {sublabel ? <p className="text-xs text-muted-foreground">{sublabel}</p> : null}
      </div>
    </div>
  );
}

function FlowArrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-2">
      <div className="h-6 w-px bg-border" />
      {label ? (
        <span className="my-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      ) : null}
      <div className="flex flex-col items-center">
        <div className="h-6 w-px bg-border" />
        <div className="-mt-1 h-0 w-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-border" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Templates                                                           */
/* ------------------------------------------------------------------ */

interface TemplateCard {
  id: string;
  name: string;
  description: string;
  steps: number;
  icon: React.ElementType;
}

const TEMPLATES: TemplateCard[] = [
  {
    id: "t1",
    name: "Lead Enrichment",
    description: "Enrich + score every new lead automatically",
    steps: 4,
    icon: Bot,
  },
  {
    id: "t2",
    name: "Re-engagement Sequence",
    description: "Trigger outreach when deals go cold",
    steps: 6,
    icon: RefreshCcw,
  },
  {
    id: "t3",
    name: "ICP Signal Alert",
    description: "Get notified when a company matches your ICP",
    steps: 3,
    icon: Zap,
  },
  {
    id: "t4",
    name: "Meeting Follow-up",
    description: "Auto-send recap + next steps after meetings",
    steps: 5,
    icon: CalendarClock,
  },
  {
    id: "t5",
    name: "Churn Risk Monitor",
    description: "Detect and alert on churn signals",
    steps: 4,
    icon: AlertTriangle,
  },
  {
    id: "t6",
    name: "LinkedIn + Email Sync",
    description: "Mirror LinkedIn actions to CRM automatically",
    steps: 7,
    icon: Link2,
  },
];

function TemplateCardComponent({ template }: { template: TemplateCard }) {
  const Icon = template.icon;
  return (
    <Card className="card-hover">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
            <Icon className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{template.description}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <Badge variant="outline" className="text-[10px]">
            <ListChecks className="mr-1 h-3 w-3" />
            {template.steps} steps
          </Badge>
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
            <Plus className="h-3.5 w-3.5" />
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

function AutomationStudioPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <PageHeader
        eyebrow="Engagement"
        title="Automation Studio"
        description="Build AI-powered workflows that run your outreach on autopilot."
        actions={
          <Button
            size="sm"
            className="bg-indigo-600 text-white hover:bg-indigo-600/90"
          >
            <Plus className="h-4 w-4" />
            New Workflow
          </Button>
        }
      />

      {/* Section 1 — Active Workflows */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Active Workflows
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Workflows currently running across your workspace.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORKFLOWS.map((w) => (
            <ActiveWorkflowCard key={w.id} workflow={w} />
          ))}
        </div>
      </section>

      {/* Section 2 — Workflow Builder */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Workflow Builder
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Design flows with triggers, actions, and branches.
            </p>
          </div>
          <Select defaultValue="blank">
            <SelectTrigger className="h-8 w-48 text-xs">
              <SelectValue placeholder="Start from template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blank">Blank workflow</SelectItem>
              <SelectItem value="enrichment">Lead Enrichment</SelectItem>
              <SelectItem value="reengage">Re-engagement</SelectItem>
              <SelectItem value="icp">ICP Signal Alert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="mt-4">
          <CardContent className="p-6">
            <div className="mx-auto max-w-md">
              <FlowNode
                type="trigger"
                label="New Lead Added"
                sublabel="Trigger: CRM record created"
              />

              <FlowArrow />

              <FlowNode
                type="action"
                label="Enrich with AI"
                sublabel="Company research + scoring"
              />

              <FlowArrow />

              <FlowNode
                type="condition"
                label="Lead Score > 70?"
                isDiamond
              />

              <div className="mt-4 grid grid-cols-2 gap-6">
                <div className="flex flex-col items-center">
                  <span className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Yes
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="h-px w-8 bg-border" />
                    <ArrowDown className="h-3.5 w-3.5 text-border" />
                  </div>
                  <div className="mt-2 w-full">
                    <FlowNode
                      type="actionGreen"
                      label="Add to Hot Sequence"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    No
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="h-px w-8 bg-border" />
                    <ArrowDown className="h-3.5 w-3.5 text-border" />
                  </div>
                  <div className="mt-2 w-full">
                    <FlowNode
                      type="actionGray"
                      label="Add to Nurture Campaign"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="mt-2 h-6 w-px bg-border" />
                <div className="flex flex-col items-center">
                  <div className="h-6 w-px bg-border" />
                  <div className="-mt-1 h-0 w-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-border" />
                </div>
              </div>

              <FlowNode
                type="actionPurple"
                label="Notify SDR via Slack"
                sublabel="Send alert to #sales-alerts"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section 3 — Workflow Templates */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Templates</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start fast with pre-built automation.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <TemplateCardComponent key={t.id} template={t} />
          ))}
        </div>
      </section>
    </div>
  );
}
