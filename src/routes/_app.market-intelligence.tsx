import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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

/* ─── Data ─── */

const INDUSTRY_DATA = [
  { name: "SaaS", score: 94 },
  { name: "Fintech", score: 87 },
  { name: "DevTools", score: 81 },
  { name: "MarTech", score: 76 },
  { name: "HR Tech", score: 68 },
];

const SIZE_DATA = [
  { name: "50-100", value: 35 },
  { name: "101-250", value: 40 },
  { name: "251-500", value: 25 },
];
const SIZE_COLORS = ["#818cf8", "#6366f1", "#4f46e5"];

const TAB_LIST = ["All", "Hiring", "Funding", "Tech Stack", "Intent"] as const;
type TabKey = (typeof TAB_LIST)[number];

const SIGNAL_ROWS = [
  {
    company: "Notion",
    signal: "Hired 3 SDRs this month",
    type: "Hiring",
    strength: "High",
    detected: "2h ago",
    action: "Outreach",
  },
  {
    company: "Linear",
    signal: "Series B $35M announced",
    type: "Funding",
    strength: "High",
    detected: "5h ago",
    action: "Outreach",
  },
  {
    company: "Figma",
    signal: "Added Salesforce to stack",
    type: "Tech Stack",
    strength: "Medium",
    detected: "1d ago",
    action: "Research",
  },
  {
    company: "Vercel",
    signal: "Visited your pricing 4x",
    type: "Intent",
    strength: "High",
    detected: "3h ago",
    action: "Outreach",
  },
  {
    company: "Stripe",
    signal: "VP Sales job posting",
    type: "Hiring",
    strength: "Medium",
    detected: "2d ago",
    action: "Watch",
  },
  {
    company: "Airtable",
    signal: "Competitor contract expiring",
    type: "Intent",
    strength: "High",
    detected: "6h ago",
    action: "Outreach",
  },
  {
    company: "Loom",
    signal: "Series C fundraising signals",
    type: "Funding",
    strength: "Medium",
    detected: "3d ago",
    action: "Research",
  },
  {
    company: "Retool",
    signal: "Tech stack gap detected",
    type: "Tech Stack",
    strength: "Low",
    detected: "4d ago",
    action: "Watch",
  },
];

const COMPETITORS = [
  {
    name: "Outreach.io",
    tagline: "Legacy sales engagement platform",
    weaknesses: [
      "Expensive per-seat pricing",
      "No WhatsApp channel",
      "Weak AI personalization",
    ],
    winRate: 67,
  },
  {
    name: "Apollo.io",
    tagline: "Data-first prospecting tool",
    weaknesses: [
      "Shallow workflow automation",
      "No meeting intelligence",
      "CRM sync issues reported",
    ],
    winRate: 54,
  },
  {
    name: "Salesloft",
    tagline: "Enterprise engagement suite",
    weaknesses: [
      "Long onboarding (3-6 months)",
      "Rigid sequence templates",
      "Limited AI agent support",
    ],
    winRate: 71,
  },
];

const TRENDS = [
  {
    icon: TrendingUp,
    title: "AI SDR adoption up 340% YoY",
    description: "Teams deploying AI reps are scaling pipeline 3× faster.",
    tint: "text-indigo-500 bg-indigo-500/10",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp outreach 3× reply rate vs email",
    description: "Enterprise buyers are shifting to conversational channels.",
    tint: "text-emerald-500 bg-emerald-500/10",
  },
  {
    icon: Globe,
    title: "APAC buying committees growing 28%",
    description: "Average deal now involves 6.4 stakeholders in APAC.",
    tint: "text-sky-500 bg-sky-500/10",
  },
  {
    icon: Target,
    title: "Intent data accuracy gap narrowing",
    description: "AI-curated signals now 89% correlated with closed-won.",
    tint: "text-violet-500 bg-violet-500/10",
  },
  {
    icon: AlertTriangle,
    title: "Email volume fatigue at all-time high",
    description: "Personalized 1:1 outreach is the only rising open-rate lever.",
    tint: "text-amber-500 bg-amber-500/10",
  },
];

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

function MarketIntelligencePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("All");
  const { data: profile } = useProfile();
  const [liveSignals, setLiveSignals] = useState<typeof SIGNAL_ROWS>(SIGNAL_ROWS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const { data } = await supabase.functions.invoke("fetch-signals", {
      body: {
        query: ["SaaS", "revenue", "B2B sales"],
        workspaceId: profile?.workspace_id,
      },
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
      toast.success(`${data.signals.length} live signals refreshed from Apollo`);
    } else {
      toast.error("Apollo fetch failed — add APOLLO_API_KEY to secrets");
    }
    setIsRefreshing(false);
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
          <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-600/90">
            <Zap className="h-4 w-4" />
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
            <Button size="icon" variant="ghost" className="h-7 w-7 -mr-2 -mt-2">
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">B2B SaaS</span>
            </div>
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">50–500 employees</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">Series A–C</span>
            </div>
            <div className="flex items-center gap-2">
              <SearchCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">VP Sales / CTO</span>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">
                Pain: Manual outreach, low reply rates
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
