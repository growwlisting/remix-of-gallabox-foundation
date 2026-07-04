import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Zap,
  Pencil,
  TrendingUp,
  ArrowUpRight,
  MessageSquare,
  Globe,
  Target,
  AlertTriangle,
  Briefcase,
  Search,
  SearchCheck,
  Eye,
  Send,
  RefreshCw,
  Loader2,
} from "lucide-react";

import { PageHeader } from "@/components/states/page-header";
import { getRouteMeta } from "@/lib/route-meta";
import { withLoading } from "@/components/states/page-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";


const meta = getRouteMeta("/market-intelligence")!;

/* ─── Data (Gallabox India workspace defaults) ─── */

const INDUSTRY_DATA = [
  { name: "D2C / Ecommerce", score: 94 },
  { name: "EdTech", score: 88 },
  { name: "Fintech", score: 82 },
  { name: "Healthcare", score: 74 },
  { name: "Real Estate", score: 66 },
];

const SIZE_DATA = [
  { name: "50-100", value: 30 },
  { name: "101-250", value: 45 },
  { name: "251-500", value: 25 },
];
const SIZE_COLORS = ["#818cf8", "#6366f1", "#4f46e5"];

const TAB_LIST = ["All", "Hiring", "Funding", "Tech Stack", "Intent"] as const;
type TabKey = (typeof TAB_LIST)[number];

// Fallback signals shown before Refresh — India-first, Gallabox-relevant.
const SIGNAL_ROWS = [
  {
    company: "Mamaearth",
    signal: "Hiring 4 CX leads (Bengaluru)",
    type: "Hiring",
    strength: "High",
    detected: "2h ago",
    action: "Outreach",
  },
  {
    company: "boAt Lifestyle",
    signal: "Series F extension announced",
    type: "Funding",
    strength: "High",
    detected: "5h ago",
    action: "Outreach",
  },
  {
    company: "upGrad",
    signal: "Added WhatsApp Business API to stack",
    type: "Tech Stack",
    strength: "High",
    detected: "1d ago",
    action: "Outreach",
  },
  {
    company: "Cred",
    signal: "Visited your pricing 4x this week",
    type: "Intent",
    strength: "High",
    detected: "3h ago",
    action: "Outreach",
  },
  {
    company: "Nykaa",
    signal: "Head of Conversational Commerce hired",
    type: "Hiring",
    strength: "Medium",
    detected: "2d ago",
    action: "Watch",
  },
  {
    company: "Meesho",
    signal: "Migrating off Freshworks — RFP open",
    type: "Intent",
    strength: "High",
    detected: "6h ago",
    action: "Outreach",
  },
  {
    company: "PhysicsWallah",
    signal: "Series D fundraising rumored",
    type: "Funding",
    strength: "Medium",
    detected: "3d ago",
    action: "Research",
  },
  {
    company: "Zepto",
    signal: "Uses Interakt — potential swap window",
    type: "Tech Stack",
    strength: "Medium",
    detected: "4d ago",
    action: "Research",
  },
];

const COMPETITORS = [
  {
    name: "Wati",
    tagline: "WhatsApp API SaaS, SMB-focused",
    weaknesses: [
      "Weak AI-native workflows",
      "Basic broadcast tooling, no revenue OS",
      "Limited CRM & pipeline features",
    ],
    winRate: 68,
  },
  {
    name: "AiSensy",
    tagline: "WhatsApp marketing platform, India",
    weaknesses: [
      "Marketing-only — no sales/CS depth",
      "Shallow chatbot builder",
      "No native lead scoring or ICP intel",
    ],
    winRate: 72,
  },
  {
    name: "Interakt",
    tagline: "Jio Haptik-owned WhatsApp suite",
    weaknesses: [
      "Rigid pricing tiers",
      "Slow API roadmap since acquisition",
      "Weak reporting for revenue teams",
    ],
    winRate: 64,
  },
  {
    name: "DoubleTick",
    tagline: "Team inbox for WhatsApp",
    weaknesses: [
      "Inbox-first — no outbound engine",
      "No AI SDR or campaign automation",
      "Limited to shared-inbox use cases",
    ],
    winRate: 76,
  },
];

const TRENDS = [
  {
    icon: MessageSquare,
    title: "WhatsApp is now default channel for Indian D2C",
    description: "82% of Indian D2C brands run primary customer journeys on WhatsApp.",
    tint: "text-emerald-500 bg-emerald-500/10",
  },
  {
    icon: TrendingUp,
    title: "AI-assisted outreach adoption +340% YoY in India",
    description: "GTM teams using AI copilots are booking 3× more qualified meetings.",
    tint: "text-indigo-500 bg-indigo-500/10",
  },
  {
    icon: Globe,
    title: "EdTech + Fintech buyer committees growing 28%",
    description: "Average Indian mid-market deal now involves 5.8 stakeholders.",
    tint: "text-sky-500 bg-sky-500/10",
  },
  {
    icon: Target,
    title: "Intent data accuracy gap narrowing",
    description: "AI-curated signals now 89% correlated with closed-won in APAC.",
    tint: "text-violet-500 bg-violet-500/10",
  },
  {
    icon: AlertTriangle,
    title: "Email open rates in India at 18% and falling",
    description: "WhatsApp + LinkedIn are the only channels with rising response rates.",
    tint: "text-amber-500 bg-amber-500/10",
  },
];

// Gallabox India ICP definition — drives Refresh Signals query.
const ICP_KEYWORDS = ["D2C India", "EdTech India", "Fintech India", "WhatsApp Business API", "conversational commerce"];

/* ─── Helpers ─── */

function strengthBadge(strength: string) {
  const map: Record<string, string> = {
    High: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300",
    Medium:
      "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
    Low: "border-slate-400/20 bg-slate-400/10 text-slate-600 dark:text-slate-300",
  };
  return map[strength] ?? map["Low"];
}

function actionButton(action: string) {
  return action === "Outreach"
    ? "bg-indigo-600 text-white hover:bg-indigo-600/90"
    : "bg-muted text-muted-foreground hover:bg-muted/80";
}

/* ─── Route ─── */

export const Route = createFileRoute("/_app/market-intelligence")({
  head: () => ({
    meta: [
      { title: `${meta.label} · Gallabox GrowthOS` },
      { name: "description", content: meta.description },
    ],
  }),
  component: withLoading(MarketIntelligencePage, "dashboard"),
});

type IcpShape = {
  industries: string;
  sizes: string;
  stage: string;
  personas: string;
  pain: string;
};

const DEFAULT_ICP: IcpShape = {
  industries: "D2C · EdTech · Fintech (India)",
  sizes: "50–500 employees",
  stage: "Series A–D, mid-market",
  personas: "Head of Growth / CMO / Founder",
  pain: "Fragmented WhatsApp + email + CRM. Low reply rates. Manual routing.",
};

function useWorkspaceIcp(workspaceId?: string | null) {
  return useQuery({
    queryKey: ["workspace-icp", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<IcpShape> => {
      const { data } = await supabase
        .from("workspaces")
        .select("icp")
        .eq("id", workspaceId!)
        .maybeSingle();
      return { ...DEFAULT_ICP, ...((data?.icp as Partial<IcpShape>) ?? {}) };
    },
  });
}

function MarketIntelligencePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("All");
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const workspaceId = profile?.workspace_id;
  const { data: icp = DEFAULT_ICP } = useWorkspaceIcp(workspaceId);
  const [liveSignals, setLiveSignals] = useState<typeof SIGNAL_ROWS>(SIGNAL_ROWS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [icpOpen, setIcpOpen] = useState(false);
  const [icpDraft, setIcpDraft] = useState<IcpShape>(icp);

  useEffect(() => { setIcpDraft(icp); }, [icp]);

  const saveIcp = async () => {
    if (!workspaceId) return;
    const { error } = await supabase.from("workspaces").update({ icp: icpDraft }).eq("id", workspaceId);
    if (error) { toast.error(error.message); return; }
    toast.success("ICP updated");
    queryClient.invalidateQueries({ queryKey: ["workspace-icp", workspaceId] });
    setIcpOpen(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const query = [icp.industries, icp.personas, "WhatsApp Business API"].filter(Boolean);
    const { data } = await supabase.functions.invoke("fetch-signals", {
      body: { query, workspaceId },
    });
    if (data?.signals?.length) {
      const mapped = data.signals.map((s: any) => ({
        company: s.company,
        signal: s.signal,
        type: s.type ?? "Intent",
        strength: s.strength ?? "Medium",
        detected: "just now",
        action: s.action ?? "Outreach",
      }));
      setLiveSignals(mapped);
      setLastUpdated(new Date());
      toast.success(`${data.signals.length} live signals refreshed for your ICP`);
    } else {
      toast.error("Signal fetch returned 0 — check Apollo/Intent provider quota");
    }
    setIsRefreshing(false);
  };

  const handleRowAction = (row: (typeof SIGNAL_ROWS)[number]) => {
    if (row.action === "Outreach") {
      toast.success(`Drafting outreach for ${row.company}`);
      navigate({ to: "/outreach-studio" });
    } else if (row.action === "Research") {
      navigate({ to: "/lead-intelligence" });
    } else {
      toast.message(`Watching ${row.company} for updates`);
    }
  };

  const filteredSignals =
    activeTab === "All"
      ? liveSignals
      : liveSignals.filter((s) => s.type === activeTab);


  return (
    <>
      <PageHeader
        eyebrow="Intelligence"
        title="Market Intelligence"
        description="AI-powered signals on your market, competitors, and buyers."
        actions={
          <Button
            size="sm"
            className="bg-indigo-600 text-white hover:bg-indigo-600/90"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Run Research
          </Button>
        }
      />

      {/* ── ICP Snapshot ── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Your ICP */}
        <Card className="card-hover">
          <CardHeader className="flex-row items-start justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Your ICP</CardTitle>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 -mr-2 -mt-2"
              onClick={() => { setIcpDraft(icp); setIcpOpen(true); }}
              title="Edit ICP"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{icp.industries}</span>
            </div>
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{icp.sizes}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{icp.stage}</span>
            </div>
            <div className="flex items-center gap-2">
              <SearchCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{icp.personas}</span>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">
                Pain: {icp.pain}
              </p>
            </div>
          </CardContent>
        </Card>


        {/* Top Industries */}
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Industries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={INDUSTRY_DATA} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    width={70}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      fontSize: 12,
                    }}
                    formatter={(val: number) => [`${val}%`, "Match Score"]}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={14}>
                    {INDUSTRY_DATA.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === 0 ? "#6366f1" : i === 1 ? "#818cf8" : "#c7d2fe"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Best Company Size */}
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Best Company Size</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="h-[160px] w-[160px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SIZE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {SIZE_DATA.map((_, i) => (
                      <Cell key={i} fill={SIZE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      fontSize: 12,
                    }}
                    formatter={(val: number, _name: string, props: { payload?: { name: string } }) => [
                      `${val}%`,
                      props.payload?.name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Sweet Spot
                </p>
                <p className="text-lg font-semibold text-foreground">101–250</p>
              </div>
              <div className="space-y-1.5">
                {SIZE_DATA.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: SIZE_COLORS[i] }}
                    />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="ml-auto font-medium text-foreground">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Buying Signals Feed ── */}
      <div className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Live Buying Signals</h2>
            <span className="text-xs text-muted-foreground">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Updated 4 min ago"}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-7 gap-1.5 text-xs"
            >
              {isRefreshing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh Signals
            </Button>
          </div>
          <div className="inline-flex h-9 items-center rounded-lg bg-muted p-1">
            {TAB_LIST.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                  activeTab === tab
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Company</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Strength</TableHead>
                <TableHead>Detected</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSignals.map((row) => (
                <TableRow key={`${row.company}-${row.signal}`}>
                  <TableCell>
                    <span className="text-sm font-medium text-foreground">{row.company}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground">{row.signal}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {row.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
                        strengthBadge(row.strength),
                      )}
                    >
                      {row.strength === "High" && (
                        <span className="text-[10px] leading-none">🔥</span>
                      )}
                      {row.strength}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.detected}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleRowAction(row)}
                      className={cn("h-7 px-3 text-xs", actionButton(row.action))}
                    >
                      {row.action === "Outreach" && <Send className="mr-1 h-3 w-3" />}
                      {row.action === "Research" && <Search className="mr-1 h-3 w-3" />}
                      {row.action === "Watch" && <Eye className="mr-1 h-3 w-3" />}
                      {row.action}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Competitor Intelligence ── */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Competitor Landscape */}
        <div>
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Competitor Landscape</h2>
          <div className="space-y-4">
            {COMPETITORS.map((c) => (
              <Card key={c.name} className="card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                        <p className="text-xs text-muted-foreground">{c.tagline}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                    >
                      Win rate {c.winRate}%
                    </Badge>
                  </div>
                  <ul className="mt-3 space-y-1.5 pl-[52px]">
                    {c.weaknesses.map((w) => (
                      <li key={w} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="mt-[5px] inline-block h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Market Trends */}
        <div>
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Market Trends</h2>
          <div className="space-y-3">
            {TRENDS.map((t) => (
              <Card key={t.title} className="card-hover">
                <CardContent className="flex items-start gap-3 p-4">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      t.tint,
                    )}
                  >
                    <t.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{t.title}</h4>
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {t.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* Small helper icon so we don't import an unused lucide name */
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
