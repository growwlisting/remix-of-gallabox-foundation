import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  Upload,
  Send,
  Plus,
  Linkedin,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Flame,
  Building2,
} from "lucide-react";

import { PageHeader } from "@/components/states/page-header";
import { getRouteMeta } from "@/lib/route-meta";
import { withLoading, PageSkeleton } from "@/components/states/page-skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useContacts, relTime, type ContactRow } from "@/hooks/use-growth-data";

const meta = getRouteMeta("/lead-intelligence")!;

type SignalTone = "intent" | "hiring" | "funding" | "tech";
type LeadStage = "Hot" | "Warm" | "Cold" | "Nurture";

type Lead = {
  id: string;
  name: string;
  title: string;
  company: string;
  companyDomain: string;
  score: number;
  signals: { label: string; tone: SignalTone }[];
  stage: LeadStage;
  lastActivity: string;
};

function contactToLead(c: ContactRow): Lead {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown";
  const domain = c.email?.split("@")[1] ?? "";
  const rawStage = c.stage as LeadStage;
  const stage: LeadStage = (["Hot", "Warm", "Cold", "Nurture"] as LeadStage[]).includes(rawStage)
    ? rawStage
    : "Cold";
  return {
    id: c.id,
    name,
    title: c.title ?? "",
    company: c.company ?? "",
    companyDomain: domain,
    score: c.lead_score,
    signals: c.signals,
    stage,
    lastActivity: relTime(c.last_activity),
  };
}

const SIGNAL_TONE: Record<SignalTone, string> = {
  intent:
    "border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
  hiring:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  funding:
    "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  tech: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300",
};

const STAGE_TONE: Record<Lead["stage"], string> = {
  Hot: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300",
  Warm: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  Cold: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300",
  Nurture:
    "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300",
};

function scoreTone(score: number) {
  if (score >= 80)
    return "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300";
  if (score >= 50)
    return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300";
  return "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

export const Route = createFileRoute("/_app/lead-intelligence")({
  head: () => ({
    meta: [
      { title: `${meta.label} · Gallabox GrowthOS` },
      { name: "description", content: meta.description },
    ],
  }),
  component: withLoading(LeadIntelligencePage, "table"),
});

function LeadIntelligencePage() {
  const { data: contacts, isLoading } = useContacts();
  const leads: Lead[] = (contacts ?? []).map(contactToLead);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = leads.find((l) => l.id === selectedId) ?? leads[0] ?? null;


  return (
    <>
      <PageHeader
        eyebrow="Intelligence"
        title="Lead Intelligence"
        description="AI-scored leads with enriched signals and buying intent."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4" />
              Import Leads
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 text-white hover:bg-indigo-600/90"
            >
              <Search className="h-4 w-4" />
              Find Leads
            </Button>
          </>
        }
      />

      {/* Filter Bar */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-9" />
        </div>
        <Select>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All industries</SelectItem>
            <SelectItem value="saas">SaaS</SelectItem>
            <SelectItem value="fintech">Fintech</SelectItem>
            <SelectItem value="devtools">DevTools</SelectItem>
            <SelectItem value="ecommerce">E-commerce</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Company size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sizes</SelectItem>
            <SelectItem value="1-50">1–50</SelectItem>
            <SelectItem value="51-200">51–200</SelectItem>
            <SelectItem value="201-1000">201–1,000</SelectItem>
            <SelectItem value="1000+">1,000+</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Lead score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All scores</SelectItem>
            <SelectItem value="hot">Hot · 80+</SelectItem>
            <SelectItem value="warm">Warm · 50–79</SelectItem>
            <SelectItem value="cold">Cold · &lt;50</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Signal type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All signals</SelectItem>
            <SelectItem value="intent">Buying intent</SelectItem>
            <SelectItem value="hiring">Hiring</SelectItem>
            <SelectItem value="funding">Funding</SelectItem>
            <SelectItem value="tech">Tech stack</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="link"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          Clear filters
        </Button>
      </div>

      {/* Table + Detail panel */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-4">
                  <Checkbox />
                </TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Signals</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LEADS.map((lead) => (
                <TableRow
                  key={lead.id}
                  onClick={() => setSelectedId(lead.id)}
                  className={cn(
                    "cursor-pointer",
                    lead.id === selectedId && "bg-muted/50",
                  )}
                >
                  <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-medium text-white">
                          {initials(lead.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">
                          {lead.name}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {lead.title}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-foreground">{lead.company}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
                        scoreTone(lead.score),
                      )}
                    >
                      {lead.score >= 80 && <Flame className="h-3 w-3" />}
                      {lead.score}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {lead.signals.map((s) => (
                        <span
                          key={s.label}
                          className={cn(
                            "rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
                            SIGNAL_TONE[s.tone],
                          )}
                        >
                          {s.label}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("font-medium", STAGE_TONE[lead.stage])}
                    >
                      {lead.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.lastActivity}
                  </TableCell>
                  <TableCell
                    className="pr-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Research">
                        <Search className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Outreach">
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Add to campaign">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Detail panel */}
        <LeadDetailPanel lead={selected} />
      </div>
    </>
  );
}

function LeadDetailPanel({ lead }: { lead: Lead }) {
  const breakdown = [
    { label: "Intent", value: 92, icon: TrendingUp },
    { label: "Fit", value: 87, icon: Users },
    { label: "Timing", value: 78, icon: Zap },
    { label: "Engagement", value: 65, icon: Flame },
  ];

  const buyingSignals = [
    { icon: TrendingUp, text: "Visited pricing page 3 times this week", tone: "text-indigo-500" },
    { icon: Users, text: "Hired 2 SDRs in the last 30 days", tone: "text-emerald-500" },
    { icon: DollarSign, text: "Increased marketing budget 40% QoQ", tone: "text-amber-500" },
    { icon: Zap, text: "Uses HubSpot, Segment, and Slack", tone: "text-sky-500" },
  ];

  return (
    <aside className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-4 lg:h-fit">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white">
            {initials(lead.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">
              {lead.name}
            </h3>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Linkedin className="h-4 w-4 text-[#0A66C2]" />
            </Button>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {lead.title} · {lead.company}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            AI Score breakdown
          </h4>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-xs font-semibold",
              scoreTone(lead.score),
            )}
          >
            {lead.score}
          </span>
        </div>
        <div className="space-y-3">
          {breakdown.map((b) => (
            <div key={b.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <b.icon className="h-3.5 w-3.5" />
                  {b.label}
                </span>
                <span className="font-medium text-foreground">{b.value}</span>
              </div>
              <Progress value={b.value} className="h-1.5" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Buying signals
        </h4>
        <ul className="space-y-2.5">
          {buyingSignals.map((s) => (
            <li key={s.text} className="flex items-start gap-2 text-sm">
              <s.icon className={cn("mt-0.5 h-4 w-4 shrink-0", s.tone)} />
              <span className="text-foreground/90">{s.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 space-y-2">
        <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-600/90">
          <Send className="h-4 w-4" />
          Draft Outreach
        </Button>
        <Button variant="outline" className="w-full">
          <Plus className="h-4 w-4" />
          Add to Campaign
        </Button>
      </div>
    </aside>
  );
}
