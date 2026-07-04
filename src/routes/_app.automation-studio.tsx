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
  Trash2,
} from "lucide-react";

import { PageHeader } from "@/components/states/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getRouteMeta } from "@/lib/route-meta";
import { withLoading } from "@/components/states/page-skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { useAITasks, useWorkflows, useContacts, useDeals, relTime, type WorkflowRow } from "@/hooks/use-growth-data";

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
/*  Active Workflow card                                                */
/* ------------------------------------------------------------------ */

function ActiveWorkflowCard({
  workflow,
  metric,
  onRun,
  onTogglePause,
  onDelete,
  isRunning,
}: {
  workflow: WorkflowRow;
  metric: number;
  onRun: (w: WorkflowRow) => void;
  onTogglePause: (w: WorkflowRow) => void;
  onDelete: (w: WorkflowRow) => void;
  isRunning: boolean;
}) {
  const active = workflow.status === "active";
  return (
    <Card className="card-hover">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate text-sm font-semibold text-foreground">
            {workflow.name}
          </h3>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2 py-0.5",
              active
                ? "border-emerald-500/20 bg-emerald-500/10"
                : "border-amber-500/20 bg-amber-500/10",
            )}
          >
            <span className="relative flex h-2 w-2">
              {active && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  active ? "bg-emerald-500" : "bg-amber-500",
                )}
              />
            </span>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider",
                active
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400",
              )}
            >
              {active ? "Active" : "Paused"}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-2xl font-bold text-foreground">{metric.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{workflow.metric_label}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            <Zap className="mr-1 h-3 w-3" />
            {workflow.trigger_label}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            <ListChecks className="mr-1 h-3 w-3" />
            {workflow.steps} steps
          </Badge>
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          Last run: {workflow.last_run_at ? relTime(workflow.last_run_at) : "never"}
        </p>

        <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTogglePause(workflow)}
            className="h-8 gap-1.5 text-xs"
          >
            {active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {active ? "Pause" : "Resume"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isRunning || !active}
            onClick={() => onRun(workflow)}
            className="h-8 gap-1.5 text-xs"
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Run Now
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(workflow)}
            className="ml-auto h-8 w-8 text-muted-foreground hover:text-rose-500"
            aria-label="Delete workflow"
          >
            <Trash2 className="h-3.5 w-3.5" />
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
  trigger: { border: "border-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/30", iconBg: "bg-indigo-500", icon: Zap },
  action: { border: "border-sky-500", bg: "bg-sky-50 dark:bg-sky-950/30", iconBg: "bg-sky-500", icon: Brain },
  condition: { border: "border-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", iconBg: "bg-amber-500", icon: GitBranch },
  actionGreen: { border: "border-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", iconBg: "bg-emerald-500", icon: ListChecks },
  actionGray: { border: "border-slate-400", bg: "bg-slate-50 dark:bg-slate-900/40", iconBg: "bg-slate-400", icon: ListChecks },
  actionPurple: { border: "border-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30", iconBg: "bg-violet-500", icon: Bell },
} as const;

type NodeTypeKey = keyof typeof NODE_TYPES;

function FlowNode({ type, label, sublabel, isDiamond }: { type: NodeTypeKey; label: string; sublabel?: string; isDiamond?: boolean }) {
  const cfg = NODE_TYPES[type];
  const Icon = cfg.icon;
  if (isDiamond) {
    return (
      <div className="flex flex-col items-center">
        <div className={cn("relative flex h-20 w-20 rotate-45 items-center justify-center rounded-xl border-2", cfg.border, cfg.bg)}>
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
    <div className={cn("flex items-center gap-3 rounded-xl border-l-4 p-4 shadow-sm", cfg.border, cfg.bg)}>
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

type FlowPreset = {
  trigger: { label: string; sublabel: string };
  action: { label: string; sublabel: string };
  condition: string;
  yes: string;
  no: string;
  final: { label: string; sublabel: string };
};

const FLOW_PRESETS: Record<string, FlowPreset> = {
  blank: {
    trigger: { label: "Start", sublabel: "Choose a trigger" },
    action: { label: "Action", sublabel: "Add an AI or app action" },
    condition: "Add a condition",
    yes: "Path A",
    no: "Path B",
    final: { label: "Notify", sublabel: "Send an alert" },
  },
  lead_enrichment: {
    trigger: { label: "New Lead Added", sublabel: "Trigger: CRM record created" },
    action: { label: "Enrich with AI", sublabel: "Company research + scoring" },
    condition: "Lead Score > 70?",
    yes: "Add to Hot Sequence",
    no: "Add to Nurture Campaign",
    final: { label: "Notify SDR via Slack", sublabel: "Send alert to #sales-alerts" },
  },
  reengagement: {
    trigger: { label: "Deal Stalled", sublabel: "No activity for 14 days" },
    action: { label: "Analyze History", sublabel: "AI summarizes deal context" },
    condition: "High-value deal?",
    yes: "AE-led win-back",
    no: "Automated re-engage",
    final: { label: "Log activity in CRM", sublabel: "Update deal timeline" },
  },
  icp_signal: {
    trigger: { label: "Daily 9am", sublabel: "Trigger: scheduled scan" },
    action: { label: "Scan Signals", sublabel: "Funding · Hiring · Tech" },
    condition: "Matches ICP?",
    yes: "Enqueue for outreach",
    no: "Archive",
    final: { label: "Notify SDR via Slack", sublabel: "Send alert to #sales-alerts" },
  },
};

/* ------------------------------------------------------------------ */
/*  Templates                                                           */
/* ------------------------------------------------------------------ */

interface TemplateCard {
  id: string;
  key: string;
  name: string;
  description: string;
  steps: number;
  trigger: string;
  metricLabel: string;
  icon: React.ElementType;
}

const TEMPLATES: TemplateCard[] = [
  { id: "t1", key: "lead_enrichment", name: "Lead Enrichment", description: "Enrich + score every new lead automatically", steps: 4, trigger: "New lead added", metricLabel: "leads processed", icon: Bot },
  { id: "t2", key: "reengagement", name: "Re-engagement Sequence", description: "Trigger outreach when deals go cold", steps: 6, trigger: "No activity 14 days", metricLabel: "deals triggered", icon: RefreshCcw },
  { id: "t3", key: "icp_signal", name: "ICP Signal Alert", description: "Get notified when a company matches your ICP", steps: 3, trigger: "Daily at 9am", metricLabel: "companies monitored", icon: Zap },
  { id: "t4", key: "meeting_followup", name: "Meeting Follow-up", description: "Auto-send recap + next steps after meetings", steps: 5, trigger: "Meeting completed", metricLabel: "recaps sent", icon: CalendarClock },
  { id: "t5", key: "churn_monitor", name: "Churn Risk Monitor", description: "Detect and alert on churn signals", steps: 4, trigger: "Weekly scan", metricLabel: "accounts monitored", icon: AlertTriangle },
  { id: "t6", key: "linkedin_sync", name: "LinkedIn + Email Sync", description: "Mirror LinkedIn actions to CRM automatically", steps: 7, trigger: "LinkedIn action", metricLabel: "actions synced", icon: Link2 },
];

function TemplateCardComponent({
  template,
  onUse,
  isRunning,
}: {
  template: TemplateCard;
  onUse: (t: TemplateCard) => void;
  isRunning: boolean;
}) {
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
          <Button
            size="sm"
            variant="ghost"
            disabled={isRunning}
            onClick={() => onUse(template)}
            className="h-7 gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  New Workflow dialog                                                 */
/* ------------------------------------------------------------------ */

function NewWorkflowDialog({
  open,
  onOpenChange,
  onCreate,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: { name: string; trigger_label: string; steps: number; template_key: string }) => Promise<void>;
  isSaving: boolean;
}) {
  const [name, setName] = useState("");
  const [templateKey, setTemplateKey] = useState<string>("blank");

  const preset = TEMPLATES.find((t) => t.key === templateKey);
  const trigger = preset?.trigger ?? "Manual";
  const steps = preset?.steps ?? 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Workflow</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wf-name">Name</Label>
            <Input id="wf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Inbound MQL Router" />
          </div>
          <div className="space-y-2">
            <Label>Start from</Label>
            <Select value={templateKey} onValueChange={setTemplateKey}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">Blank workflow</SelectItem>
                {TEMPLATES.map((t) => (
                  <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Trigger: <span className="font-medium text-foreground">{trigger}</span> · {steps} steps
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!name.trim() || isSaving}
            onClick={async () => {
              await onCreate({
                name: name.trim(),
                trigger_label: trigger,
                steps,
                template_key: templateKey,
              });
              setName("");
              setTemplateKey("blank");
            }}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create workflow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

function AutomationStudioPage() {
  const { data: profile } = useProfile();
  const { data: tasks = [] } = useAITasks();
  const { data: workflows = [] } = useWorkflows();
  const { data: contacts = [] } = useContacts();
  const { data: deals = [] } = useDeals();

  const [runningId, setRunningId] = useState<string | null>(null);
  const [savingWorkflow, setSavingWorkflow] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [builderTemplate, setBuilderTemplate] = useState<string>("lead_enrichment");

  const workflowLog = tasks
    .filter((t) => t.agent_name === "Workflow Builder")
    .slice(0, 8);

  const preset = FLOW_PRESETS[builderTemplate] ?? FLOW_PRESETS.blank;

  // Live metrics per workflow (real workspace data)
  const metricFor = (w: WorkflowRow): number => {
    switch (w.template_key) {
      case "lead_enrichment":
        return contacts.filter((c) => (c.lead_score ?? 0) > 0).length;
      case "reengagement":
        return deals.filter((d) => (d.days_in_stage ?? 0) >= 14).length;
      case "icp_signal":
        return contacts.length;
      default:
        return tasks.filter(
          (t) => t.agent_name === "Workflow Builder" && t.task_description === w.name,
        ).length;
    }
  };

  const runWorkflow = async (workflow: WorkflowRow) => {
    if (!profile?.workspace_id) return;
    setRunningId(workflow.id);
    try {
      // Log task row
      await supabase.from("ai_tasks").insert({
        workspace_id: profile.workspace_id,
        agent_name: "Workflow Builder",
        task_description: workflow.name,
        status: "queued",
      });
      // Persist last_run_at
      await supabase
        .from("workflows")
        .update({ last_run_at: new Date().toISOString() })
        .eq("id", workflow.id);

      const { data, error } = await supabase.functions.invoke("trigger-workflow", {
        body: {
          workflowId: workflow.id,
          workflowName: workflow.name,
          workspaceId: profile.workspace_id,
        },
      });
      if (error) throw error;
      if (data?.status === "triggered") {
        toast.success(`${workflow.name} triggered`);
      } else {
        toast(`${workflow.name} queued`, {
          description: "Configure N8N_WEBHOOK_BASE_URL to fire external automations.",
        });
      }
    } catch (e) {
      toast.error("Workflow queued locally", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setRunningId(null);
    }
  };

  const togglePause = async (workflow: WorkflowRow) => {
    const next = workflow.status === "active" ? "paused" : "active";
    const { error } = await supabase.from("workflows").update({ status: next }).eq("id", workflow.id);
    if (error) toast.error(error.message);
    else toast.success(`Workflow ${next === "active" ? "resumed" : "paused"}`);
  };

  const deleteWorkflow = async (workflow: WorkflowRow) => {
    if (!confirm(`Delete "${workflow.name}"?`)) return;
    const { error } = await supabase.from("workflows").delete().eq("id", workflow.id);
    if (error) toast.error(error.message);
    else toast.success("Workflow deleted");
  };

  const createWorkflow = async (payload: {
    name: string;
    trigger_label: string;
    steps: number;
    template_key: string;
  }) => {
    if (!profile?.workspace_id) {
      toast.error("No workspace found");
      return;
    }
    setSavingWorkflow(true);
    const { error } = await supabase.from("workflows").insert({
      workspace_id: profile.workspace_id,
      name: payload.name,
      status: "active",
      trigger_label: payload.trigger_label,
      steps: payload.steps,
      template_key: payload.template_key === "blank" ? null : payload.template_key,
      metric_label:
        TEMPLATES.find((t) => t.key === payload.template_key)?.metricLabel ?? "runs",
    });
    setSavingWorkflow(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Workflow created");
      setNewOpen(false);
    }
  };

  const useTemplate = async (template: TemplateCard) => {
    await createWorkflow({
      name: template.name,
      trigger_label: template.trigger,
      steps: template.steps,
      template_key: template.key,
    });
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Engagement"
        title="Automation Studio"
        description="Build AI-powered workflows that run your outreach on autopilot."
        actions={
          <Button
            size="sm"
            onClick={() => setNewOpen(true)}
            className="bg-indigo-600 text-white hover:bg-indigo-600/90"
          >
            <Plus className="h-4 w-4" />
            New Workflow
          </Button>
        }
      />

      <NewWorkflowDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreate={createWorkflow}
        isSaving={savingWorkflow}
      />

      {/* Section 1 — Active Workflows */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Active Workflows</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Workflows currently running across your workspace.
        </p>
        {workflows.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No workflows yet. Click <span className="font-medium">New Workflow</span> or pick a template below.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((w) => (
              <ActiveWorkflowCard
                key={w.id}
                workflow={w}
                metric={metricFor(w)}
                onRun={runWorkflow}
                onTogglePause={togglePause}
                onDelete={deleteWorkflow}
                isRunning={runningId === w.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 2 — Workflow Builder */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Workflow Builder</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Preview flow logic before saving as a workflow.
            </p>
          </div>
          <Select value={builderTemplate} onValueChange={setBuilderTemplate}>
            <SelectTrigger className="h-8 w-56 text-xs">
              <SelectValue placeholder="Start from template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blank">Blank workflow</SelectItem>
              <SelectItem value="lead_enrichment">Lead Enrichment</SelectItem>
              <SelectItem value="reengagement">Re-engagement</SelectItem>
              <SelectItem value="icp_signal">ICP Signal Alert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="mt-4">
          <CardContent className="p-6">
            <div className="mx-auto max-w-md">
              <FlowNode type="trigger" label={preset.trigger.label} sublabel={preset.trigger.sublabel} />
              <FlowArrow />
              <FlowNode type="action" label={preset.action.label} sublabel={preset.action.sublabel} />
              <FlowArrow />
              <FlowNode type="condition" label={preset.condition} isDiamond />
              <div className="mt-4 grid grid-cols-2 gap-6">
                <div className="flex flex-col items-center">
                  <span className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Yes</span>
                  <div className="flex items-center gap-1">
                    <div className="h-px w-8 bg-border" />
                    <ArrowDown className="h-3.5 w-3.5 text-border" />
                  </div>
                  <div className="mt-2 w-full">
                    <FlowNode type="actionGreen" label={preset.yes} />
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">No</span>
                  <div className="flex items-center gap-1">
                    <div className="h-px w-8 bg-border" />
                    <ArrowDown className="h-3.5 w-3.5 text-border" />
                  </div>
                  <div className="mt-2 w-full">
                    <FlowNode type="actionGray" label={preset.no} />
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
              <FlowNode type="actionPurple" label={preset.final.label} sublabel={preset.final.sublabel} />
              <div className="mt-6 flex justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const t = TEMPLATES.find((x) => x.key === builderTemplate);
                    if (t) useTemplate(t);
                    else setNewOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Save as workflow
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section 3 — Templates */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Templates</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start fast with pre-built automation.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <TemplateCardComponent
              key={t.id}
              template={t}
              onUse={useTemplate}
              isRunning={savingWorkflow}
            />
          ))}
        </div>
      </section>

      {/* Section 4 — Webhook Activity Log */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Webhook Activity Log</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Recent workflow triggers across your workspace.
        </p>
        <Card className="mt-4">
          <CardContent className="p-0">
            {workflowLog.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <Activity className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No workflow activity yet. Trigger a template or workflow to see it here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {workflowLog.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {task.task_description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {task.created_at ? new Date(task.created_at).toLocaleString() : "—"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] capitalize",
                        task.status === "completed" &&
                          "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
                        task.status === "running" &&
                          "border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
                        task.status === "queued" &&
                          "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
                        task.status === "failed" &&
                          "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300",
                      )}
                    >
                      {task.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
