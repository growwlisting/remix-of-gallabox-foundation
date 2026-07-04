import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const allLeads: Lead[] = (contacts ?? []).map(contactToLead);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filter state
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState<string>("all");
  const [size, setSize] = useState<string>("all");
  const [scoreBand, setScoreBand] = useState<string>("all");
  const [signalType, setSignalType] = useState<string>("all");

  // Company → industry heuristic for demo data
  const industryFor = (company: string) => {
    const c = company.toLowerCase();
    if (/ramp|cred|razorpay|stripe|fintech/.test(c)) return "fintech";
    if (/vercel|linear|retool|figma|notion|airtable|loom/.test(c)) return "devtools";
    if (/mamaearth|boat|nykaa|meesho|zepto|d2c/.test(c)) return "ecommerce";
    return "saas";
  };

  const leads = useMemo(() => {
    return allLeads.filter((l) => {
      if (q && !`${l.name} ${l.company} ${l.title}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      if (industry !== "all" && industryFor(l.company) !== industry) return false;
      if (scoreBand === "hot" && l.score < 80) return false;
      if (scoreBand === "warm" && (l.score < 50 || l.score >= 80)) return false;
      if (scoreBand === "cold" && l.score >= 50) return false;
      if (signalType !== "all" && !l.signals.some((s) => s.tone === signalType)) return false;
      // size filter is a UX-only placeholder for demo contacts (no size field)
      if (size !== "all") return true;
      return true;
    });
  }, [allLeads, q, industry, scoreBand, signalType, size]);

  const selected = leads.find((l) => l.id === selectedId) ?? allLeads.find((l) => l.id === selectedId) ?? null;

  const clearFilters = () => {
    setQ(""); setIndustry("all"); setSize("all"); setScoreBand("all"); setSignalType("all");
  };

  const addLeadToPipeline = async (lead: Lead) => {
    if (!profile?.workspace_id) return;
    const { error } = await supabase.from("deals").insert({
      workspace_id: profile.workspace_id,
      company_name: lead.company || lead.name,
      value: null,
      stage: "prospecting",
      channels: ["email"],
      days_in_stage: 0,
      ai_signal: `From lead: ${lead.name}`,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`${lead.company || lead.name} added to pipeline`);
    queryClient.invalidateQueries({ queryKey: ["deals", profile.workspace_id] });
  };

  useEffect(() => {
    const seed = async () => {
      const workspaceId = profile?.workspace_id;
      if (!workspaceId) return;
      const { count } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId);
      if (count && count > 0) return;
      const now = new Date();
      const mins = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();
      const mock = [
        { first_name: "Sarah", last_name: "Chen", title: "VP of Sales", company: "Notion Labs", email: "sarah@notion.so", linkedin_url: "https://linkedin.com/in/sarahchen", lead_score: 94, stage: "Hot", last_activity: mins(12), signals: [{ label: "Hiring 5 AEs", tone: "hiring" }, { label: "Series C closed", tone: "funding" }, { label: "Visited pricing 4x", tone: "intent" }], workspace_id: workspaceId },
        { first_name: "Marcus", last_name: "Rivera", title: "Head of RevOps", company: "Vercel", email: "marcus@vercel.com", linkedin_url: "https://linkedin.com/in/mrivera", lead_score: 89, stage: "Hot", last_activity: mins(45), signals: [{ label: "Downloaded whitepaper", tone: "intent" }, { label: "Uses Salesforce", tone: "tech" }], workspace_id: workspaceId },
        { first_name: "Priya", last_name: "Nair", title: "CRO", company: "Ramp", email: "priya@ramp.com", linkedin_url: "https://linkedin.com/in/priyanair", lead_score: 87, stage: "Hot", last_activity: mins(120), signals: [{ label: "Hiring SDR team", tone: "hiring" }, { label: "Intent surge fintech", tone: "intent" }], workspace_id: workspaceId },
        { first_name: "Daniel", last_name: "Park", title: "Director of Growth", company: "Linear", email: "daniel@linear.app", linkedin_url: "https://linkedin.com/in/danielpark", lead_score: 72, stage: "Warm", last_activity: mins(360), signals: [{ label: "Opened 3 emails", tone: "intent" }, { label: "Migrating to HubSpot", tone: "tech" }], workspace_id: workspaceId },
        { first_name: "Emily", last_name: "Zhang", title: "Sales Ops Lead", company: "Figma", email: "emily@figma.com", linkedin_url: "https://linkedin.com/in/emilyzhang", lead_score: 68, stage: "Warm", last_activity: mins(720), signals: [{ label: "Series D funding", tone: "funding" }], workspace_id: workspaceId },
        { first_name: "James", last_name: "O'Connor", title: "VP Marketing", company: "Retool", email: "james@retool.com", linkedin_url: "https://linkedin.com/in/joconnor", lead_score: 61, stage: "Warm", last_activity: mins(1440), signals: [{ label: "Uses Marketo", tone: "tech" }, { label: "Hiring PMM", tone: "hiring" }], workspace_id: workspaceId },
        { first_name: "Ana", last_name: "Silva", title: "Founder", company: "Loom", email: "ana@loom.com", linkedin_url: "https://linkedin.com/in/anasilva", lead_score: 42, stage: "Cold", last_activity: mins(4320), signals: [{ label: "Newsletter subscriber", tone: "intent" }], workspace_id: workspaceId },
        { first_name: "Tom", last_name: "Becker", title: "Growth PM", company: "Airtable", email: "tom@airtable.com", linkedin_url: "https://linkedin.com/in/tombecker", lead_score: 35, stage: "Nurture", last_activity: mins(10080), signals: [{ label: "Attended webinar Q1", tone: "intent" }], workspace_id: workspaceId },
      ];
      await supabase.from("contacts").insert(mock);
      queryClient.invalidateQueries({ queryKey: ["contacts", workspaceId] });
    };
    seed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.workspace_id]);




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
          <Input placeholder="Search leads..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={industry} onValueChange={setIndustry}>
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
        <Select value={size} onValueChange={setSize}>
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
        <Select value={scoreBand} onValueChange={setScoreBand}>
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
        <Select value={signalType} onValueChange={setSignalType}>
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
          onClick={clearFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear filters
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">{leads.length} of {allLeads.length}</span>
      </div>


      {/* Table */}
      {isLoading ? (
        <div className="mt-6"><PageSkeleton variant="table" /></div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads yet"
          description="Import leads or find new ICP matches to get started."
        />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-4">
                  <Checkbox />
                </TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="min-w-[220px]">Signals</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="whitespace-nowrap">Last Activity</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
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
                      <span className="truncate text-sm text-foreground">{lead.company}</span>
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
                      {lead.signals.slice(0, 2).map((s) => (
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
                      {lead.signals.length > 2 && (
                        <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          +{lead.signals.length - 2}
                        </span>
                      )}
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
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {lead.lastActivity}
                  </TableCell>
                  <TableCell
                    className="pr-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Research" onClick={() => setSelectedId(lead.id)}>
                        <Search className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Draft outreach" onClick={() => navigate({ to: "/outreach-studio" })}>
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Add to pipeline" onClick={() => addLeadToPipeline(lead)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
          {selected && (
            <LeadDetailPanel
              lead={selected}
              onDraftOutreach={() => navigate({ to: "/outreach-studio" })}
              onAddToCampaign={() => navigate({ to: "/campaign-studio" })}
              onAddToPipeline={() => addLeadToPipeline(selected)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// Deterministic per-lead pseudo-metric derived from lead id + base score.
function leadHash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
function deriveBreakdown(lead: Lead) {
  const h = leadHash(lead.id);
  const base = lead.score;
  const jitter = (offset: number, spread: number) =>
    Math.max(10, Math.min(99, base + (((h >> offset) & 0xff) % spread) - spread / 2));
  const hasSignal = (tone: SignalTone) => lead.signals.some((s) => s.tone === tone);
  return [
    { label: "Intent", value: hasSignal("intent") ? Math.min(99, base + 6) : jitter(0, 22), icon: TrendingUp },
    { label: "Fit", value: jitter(8, 18), icon: Users },
    { label: "Timing", value: hasSignal("funding") || hasSignal("hiring") ? Math.min(99, base + 4) : jitter(16, 26), icon: Zap },
    { label: "Engagement", value: jitter(24, 30), icon: Flame },
  ];
}

function deriveBuyingSignals(lead: Lead) {
  const out: { icon: typeof TrendingUp; text: string; tone: string }[] = [];
  for (const s of lead.signals) {
    if (s.tone === "intent")
      out.push({ icon: TrendingUp, text: `${s.label} — high buying intent detected`, tone: "text-indigo-500" });
    else if (s.tone === "hiring")
      out.push({ icon: Users, text: `${s.label} — team expansion in progress`, tone: "text-emerald-500" });
    else if (s.tone === "funding")
      out.push({ icon: DollarSign, text: `${s.label} — fresh budget available`, tone: "text-amber-500" });
    else if (s.tone === "tech")
      out.push({ icon: Zap, text: `${s.label} — compatible stack`, tone: "text-sky-500" });
  }
  if (out.length === 0) {
    out.push({ icon: TrendingUp, text: `No strong signals yet for ${lead.company}`, tone: "text-muted-foreground" });
  }
  return out;
}

function LeadDetailPanel({
  lead,
  onDraftOutreach,
  onAddToCampaign,
  onAddToPipeline,
}: {
  lead: Lead;
  onDraftOutreach?: () => void;
  onAddToCampaign?: () => void;
  onAddToPipeline?: () => void;
}) {
  const breakdown = deriveBreakdown(lead);
  const buyingSignals = deriveBuyingSignals(lead);

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b border-border p-5">
        <SheetTitle className="sr-only">Lead details for {lead.name}</SheetTitle>
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white">
              {initials(lead.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 text-left">
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
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className={cn("font-medium", STAGE_TONE[lead.stage])}>
                {lead.stage}
              </Badge>
              <span className="text-xs text-muted-foreground">Last activity {lead.lastActivity}</span>
            </div>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-6 p-5">
        <div>
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

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Buying signals
          </h4>
          <ul className="space-y-2.5">
            {buyingSignals.map((s, i) => (
              <li key={`${s.text}-${i}`} className="flex items-start gap-2 text-sm">
                <s.icon className={cn("mt-0.5 h-4 w-4 shrink-0", s.tone)} />
                <span className="text-foreground/90">{s.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-2 border-t border-border p-5">
        <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-600/90">
          <Send className="h-4 w-4" />
          Draft Outreach
        </Button>
        <Button variant="outline" className="w-full">
          <Plus className="h-4 w-4" />
          Add to Campaign
        </Button>
      </div>
    </div>
  );
}

