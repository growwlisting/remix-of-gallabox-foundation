import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Bot,
  User as UserIcon,
  Sparkles,
  Loader2,
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

const INDUSTRY_OPTIONS: { value: string; label: string }[] = [
  { value: "real_estate", label: "Real Estate" },
  { value: "education", label: "Education" },
  { value: "travel", label: "Travel" },
  { value: "healthcare", label: "Healthcare" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "finance", label: "Finance" },
  { value: "logistics", label: "Logistics" },
  { value: "automotive", label: "Automotive" },
  { value: "professional_services", label: "Professional Services" },
];

const INDUSTRY_LABEL: Record<string, string> = Object.fromEntries(
  INDUSTRY_OPTIONS.map((i) => [i.value, i.label]),
);

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
  industry: string;
};

// Auto stage rule from score. Manual override always wins if set on the row.
function autoStageFromScore(score: number): LeadStage {
  if (score >= 80) return "Hot";
  if (score >= 50) return "Warm";
  return "Cold";
}

// Company → industry heuristic used only when contact.industry is empty.
function guessIndustry(company: string): string {
  const c = (company || "").toLowerCase();
  if (/nobroker|magicbricks|housing|square ?yards|realty|estate/.test(c)) return "real_estate";
  if (/byju|unacad|vedantu|physicswallah|upgrad|school|edtech|learn/.test(c)) return "education";
  if (/makemytrip|goibibo|yatra|oyo|ixigo|cleartrip|travel/.test(c)) return "travel";
  if (/practo|1mg|pharmeasy|apollo|medi|health|hospital/.test(c)) return "healthcare";
  if (/mamaearth|boat|nykaa|meesho|zepto|flipkart|amazon|shop|commerce|d2c/.test(c)) return "ecommerce";
  if (/razorpay|cred|zerodha|paytm|phonepe|bank|fintech|finance|capital/.test(c)) return "finance";
  if (/delhivery|ecom ?express|shiprocket|logi|freight|shipping/.test(c)) return "logistics";
  if (/tata motors|mahindra|ola electric|ather|auto|motor|vehicle/.test(c)) return "automotive";
  if (/consult|advisor|law|legal|deloitte|kpmg|ey|pwc/.test(c)) return "professional_services";
  return "professional_services";
}

function contactToLead(c: ContactRow & { industry?: string | null }): Lead {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown";
  const domain = c.email?.split("@")[1] ?? "";
  const industry = (c.industry && c.industry.trim()) || guessIndustry(c.company ?? "");
  const rawStage = c.stage as LeadStage;
  const stage: LeadStage = (["Hot", "Warm", "Cold", "Nurture"] as LeadStage[]).includes(rawStage)
    ? rawStage
    : autoStageFromScore(c.lead_score);
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
    industry,
  };
}

const SIGNAL_TONE: Record<SignalTone, string> = {
  intent: "border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
  hiring: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  funding: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  tech: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300",
};

const STAGE_TONE: Record<Lead["stage"], string> = {
  Hot: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300",
  Warm: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  Cold: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300",
  Nurture: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300",
};

function scoreTone(score: number) {
  if (score >= 80) return "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300";
  if (score >= 50) return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300";
  return "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300";
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
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

type ActivityRow = {
  id: string;
  actor_type: string;
  actor_name: string | null;
  action: string;
  description: string | null;
  created_at: string;
};

async function logActivity(params: {
  workspaceId: string;
  contactId: string;
  actorType: "user" | "ai" | "system";
  actorName?: string | null;
  action: string;
  description?: string;
}) {
  await (supabase.from("lead_activities") as any).insert({
    workspace_id: params.workspaceId,
    contact_id: params.contactId,
    actor_type: params.actorType,
    actor_name: params.actorName ?? null,
    action: params.action,
    description: params.description ?? null,
  });
}

function useLeadActivities(contactId: string | null) {
  return useQuery({
    enabled: !!contactId,
    queryKey: ["lead_activities", contactId],
    queryFn: async (): Promise<ActivityRow[]> => {
      const { data, error } = await (supabase.from("lead_activities") as any)
        .select("id, actor_type, actor_name, action, description, created_at")
        .eq("contact_id", contactId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ActivityRow[];
    },
  });
}

function LeadIntelligencePage() {
  const { data: contacts, isLoading } = useContacts();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const allLeads: Lead[] = (contacts ?? []).map((c) => contactToLead(c as any));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [finding, setFinding] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState<string>("all");
  const [size, setSize] = useState<string>("all");
  const [scoreBand, setScoreBand] = useState<string>("all");
  const [signalType, setSignalType] = useState<string>("all");

  const leads = useMemo(() => {
    return allLeads.filter((l) => {
      if (q && !`${l.name} ${l.company} ${l.title}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      if (industry !== "all" && l.industry !== industry) return false;
      if (scoreBand === "hot" && l.score < 80) return false;
      if (scoreBand === "warm" && (l.score < 50 || l.score >= 80)) return false;
      if (scoreBand === "cold" && l.score >= 50) return false;
      if (signalType !== "all" && !l.signals.some((s) => s.tone === signalType)) return false;
      if (size !== "all") return true;
      return true;
    });
  }, [allLeads, q, industry, scoreBand, signalType, size]);

  const selected =
    leads.find((l) => l.id === selectedId) ??
    allLeads.find((l) => l.id === selectedId) ??
    null;

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
    await logActivity({
      workspaceId: profile.workspace_id,
      contactId: lead.id,
      actorType: "user",
      actorName: profile.full_name ?? profile.email ?? "User",
      action: "Added to pipeline",
      description: `Created deal for ${lead.company || lead.name}`,
    });
    toast.success(`${lead.company || lead.name} added to pipeline`);
    queryClient.invalidateQueries({ queryKey: ["deals", profile.workspace_id] });
    queryClient.invalidateQueries({ queryKey: ["lead_activities", lead.id] });
  };

  // Import Leads: CSV upload → contacts.insert
  const onImportClick = () => fileRef.current?.click();
  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !profile?.workspace_id) return;
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) { toast.error("CSV is empty"); return; }
      const inserts = rows.map((r) => ({
        workspace_id: profile.workspace_id!,
        first_name: r.first_name ?? r.firstname ?? r["first name"] ?? null,
        last_name: r.last_name ?? r.lastname ?? r["last name"] ?? null,
        title: r.title ?? r.role ?? null,
        company: r.company ?? r.organization ?? null,
        email: r.email ?? null,
        linkedin_url: r.linkedin ?? r.linkedin_url ?? null,
        industry: r.industry ?? null,
        lead_score: Number(r.score ?? r.lead_score ?? 50) || 50,
        stage: (r.stage as string) || autoStageFromScore(Number(r.score ?? r.lead_score ?? 50) || 50),
        signals: [],
        last_activity: new Date().toISOString(),
      }));
      const { data, error } = await supabase.from("contacts").insert(inserts).select("id, company");
      if (error) { toast.error(error.message); return; }
      toast.success(`Imported ${inserts.length} lead${inserts.length === 1 ? "" : "s"}`);
      queryClient.invalidateQueries({ queryKey: ["contacts", profile.workspace_id] });
      // log activity per lead
      await Promise.all(
        (data ?? []).map((c: any) =>
          logActivity({
            workspaceId: profile.workspace_id!,
            contactId: c.id,
            actorType: "user",
            actorName: profile.full_name ?? profile.email ?? "User",
            action: "Imported from CSV",
            description: `Imported ${c.company ?? "lead"} via CSV upload`,
          }),
        ),
      );
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // Find Leads: invoke run-agent with the workspace ICP.
  const onFindLeads = async () => {
    if (!profile?.workspace_id) return;
    setFinding(true);
    try {
      const { data: ws } = await (supabase.from("workspaces") as any)
        .select("icp, name")
        .eq("id", profile.workspace_id)
        .maybeSingle();
      const icp = ws?.icp ?? {};
      const { data, error } = await supabase.functions.invoke("run-agent", {
        body: {
          workspace_id: profile.workspace_id,
          agent: "lead-finder",
          input: { icp, count: 10 },
        },
      });
      if (error) throw error;
      toast.success(
        typeof data === "object" && data && "message" in (data as any)
          ? String((data as any).message)
          : "AI Lead Finder started — new leads will appear as they’re scored.",
      );
      queryClient.invalidateQueries({ queryKey: ["contacts", profile.workspace_id] });
      queryClient.invalidateQueries({ queryKey: ["ai_tasks", profile.workspace_id] });
    } catch (err) {
      toast.error(`Find Leads failed: ${(err as Error).message}`);
    } finally {
      setFinding(false);
    }
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
        { first_name: "Aditi", last_name: "Sharma", title: "Head of Growth", company: "Mamaearth", email: "aditi@mamaearth.in", industry: "ecommerce", lead_score: 92, stage: "Hot", last_activity: mins(15), signals: [{ label: "Hiring 3 growth PMs", tone: "hiring" }, { label: "Visited pricing 5x", tone: "intent" }], workspace_id: workspaceId },
        { first_name: "Rohit", last_name: "Verma", title: "CMO", company: "boAt", email: "rohit@boat-lifestyle.com", industry: "ecommerce", lead_score: 88, stage: "Hot", last_activity: mins(60), signals: [{ label: "WhatsApp API RFP", tone: "intent" }], workspace_id: workspaceId },
        { first_name: "Neha", last_name: "Kapoor", title: "VP Marketing", company: "Zepto", email: "neha@zeptonow.com", industry: "ecommerce", lead_score: 85, stage: "Hot", last_activity: mins(120), signals: [{ label: "Series F closed", tone: "funding" }], workspace_id: workspaceId },
        { first_name: "Karan", last_name: "Mehta", title: "Founder", company: "Physics Wallah", email: "karan@pw.live", industry: "education", lead_score: 76, stage: "Warm", last_activity: mins(360), signals: [{ label: "Opened 4 emails", tone: "intent" }], workspace_id: workspaceId },
        { first_name: "Ishita", last_name: "Rao", title: "Growth Lead", company: "MakeMyTrip", email: "ishita@makemytrip.com", industry: "travel", lead_score: 71, stage: "Warm", last_activity: mins(720), signals: [{ label: "Using Twilio", tone: "tech" }], workspace_id: workspaceId },
        { first_name: "Vikram", last_name: "Singh", title: "Head of Digital", company: "NoBroker", email: "vikram@nobroker.in", industry: "real_estate", lead_score: 64, stage: "Warm", last_activity: mins(1440), signals: [{ label: "Hiring PMM", tone: "hiring" }], workspace_id: workspaceId },
        { first_name: "Anjali", last_name: "Iyer", title: "Marketing Manager", company: "Practo", email: "anjali@practo.com", industry: "healthcare", lead_score: 58, stage: "Warm", last_activity: mins(2880), signals: [{ label: "Newsletter subscriber", tone: "intent" }], workspace_id: workspaceId },
        { first_name: "Rahul", last_name: "Nair", title: "Ops Lead", company: "Delhivery", email: "rahul@delhivery.com", industry: "logistics", lead_score: 45, stage: "Cold", last_activity: mins(4320), signals: [{ label: "Attended webinar", tone: "intent" }], workspace_id: workspaceId },
        { first_name: "Meera", last_name: "Joshi", title: "CRM Lead", company: "Razorpay", email: "meera@razorpay.com", industry: "finance", lead_score: 82, stage: "Hot", last_activity: mins(90), signals: [{ label: "Uses HubSpot", tone: "tech" }, { label: "Intent surge", tone: "intent" }], workspace_id: workspaceId },
        { first_name: "Sanjay", last_name: "Kumar", title: "Head of Sales", company: "Tata Motors", email: "sanjay@tatamotors.com", industry: "automotive", lead_score: 38, stage: "Cold", last_activity: mins(10080), signals: [], workspace_id: workspaceId },
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
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onImportFile}
            />
            <Button variant="outline" size="sm" onClick={onImportClick}>
              <Upload className="h-4 w-4" />
              Import Leads
            </Button>
            <Button
              size="sm"
              disabled={finding}
              onClick={onFindLeads}
              className="bg-indigo-600 text-white hover:bg-indigo-600/90"
            >
              {finding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
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
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All industries</SelectItem>
            {INDUSTRY_OPTIONS.map((i) => (
              <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
            ))}
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
                <TableHead>Industry</TableHead>
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
                        <div className="truncate text-sm font-medium text-foreground">{lead.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{lead.title}</div>
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
                    <span className="text-xs text-muted-foreground">
                      {INDUSTRY_LABEL[lead.industry] ?? lead.industry}
                    </span>
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
                    <Badge variant="outline" className={cn("font-medium", STAGE_TONE[lead.stage])}>
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
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-lg">
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

// -------- CSV parser (minimal, header row required) --------
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const split = (line: string) => {
    const out: string[] = []; let cur = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { out.push(cur); cur = ""; continue; }
      cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const headers = split(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = split(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ""; });
    return row;
  });
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
    if (s.tone === "intent") out.push({ icon: TrendingUp, text: `${s.label} — high buying intent detected`, tone: "text-indigo-500" });
    else if (s.tone === "hiring") out.push({ icon: Users, text: `${s.label} — team expansion in progress`, tone: "text-emerald-500" });
    else if (s.tone === "funding") out.push({ icon: DollarSign, text: `${s.label} — fresh budget available`, tone: "text-amber-500" });
    else if (s.tone === "tech") out.push({ icon: Zap, text: `${s.label} — compatible stack`, tone: "text-sky-500" });
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
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const { data: activities } = useLeadActivities(lead.id);
  const [savingStage, setSavingStage] = useState(false);

  const suggested = autoStageFromScore(lead.score);

  const changeStage = async (next: LeadStage) => {
    if (!profile?.workspace_id || next === lead.stage) return;
    setSavingStage(true);
    const { error } = await supabase
      .from("contacts")
      .update({ stage: next })
      .eq("id", lead.id);
    setSavingStage(false);
    if (error) { toast.error(error.message); return; }
    await logActivity({
      workspaceId: profile.workspace_id,
      contactId: lead.id,
      actorType: "user",
      actorName: profile.full_name ?? profile.email ?? "User",
      action: "Stage changed",
      description: `${lead.stage} → ${next}`,
    });
    toast.success(`Stage updated to ${next}`);
    queryClient.invalidateQueries({ queryKey: ["contacts", profile.workspace_id] });
    queryClient.invalidateQueries({ queryKey: ["lead_activities", lead.id] });
  };

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
              <h3 className="truncate text-base font-semibold text-foreground">{lead.name}</h3>
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
        {/* Stage editor */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Stage
          </h4>
          <div className="flex items-center gap-2">
            <Select value={lead.stage} onValueChange={(v) => changeStage(v as LeadStage)}>
              <SelectTrigger className="h-9 w-[160px]" disabled={savingStage}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["Hot", "Warm", "Cold", "Nurture"] as LeadStage[]).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {suggested !== lead.stage && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => changeStage(suggested)}
                disabled={savingStage}
              >
                Use AI suggestion: {suggested}
              </Button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            AI auto-rule: score ≥ 80 → Hot · 50–79 → Warm · &lt; 50 → Cold. Manual stage always wins.
          </p>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              AI Score breakdown
            </h4>
            <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", scoreTone(lead.score))}>
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

        {/* Activity log */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Activity log
          </h4>
          {!activities || activities.length === 0 ? (
            <p className="text-xs text-muted-foreground">No activity yet. Actions by you or AI will appear here.</p>
          ) : (
            <ol className="relative space-y-3 border-l border-border pl-4">
              {activities.map((a) => {
                const isAi = a.actor_type === "ai";
                const Icon = isAi ? Bot : UserIcon;
                return (
                  <li key={a.id} className="relative">
                    <span className={cn(
                      "absolute -left-[22px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border bg-background",
                      isAi ? "border-violet-500/40 text-violet-500" : "border-indigo-500/40 text-indigo-500",
                    )}>
                      <Icon className="h-2.5 w-2.5" />
                    </span>
                    <div className="text-sm text-foreground">{a.action}</div>
                    {a.description && (
                      <div className="text-xs text-muted-foreground">{a.description}</div>
                    )}
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {isAi ? "AI" : a.actor_name ?? "User"} · {relTime(a.created_at)}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      <div className="space-y-2 border-t border-border p-5">
        <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-600/90" onClick={onDraftOutreach}>
          <Send className="h-4 w-4" />
          Draft Outreach
        </Button>
        <Button variant="outline" className="w-full" onClick={onAddToCampaign}>
          <Plus className="h-4 w-4" />
          Add to Campaign
        </Button>
        <Button variant="outline" className="w-full" onClick={onAddToPipeline}>
          <TrendingUp className="h-4 w-4" />
          Add to Pipeline (CRM)
        </Button>
      </div>
    </div>
  );
}
