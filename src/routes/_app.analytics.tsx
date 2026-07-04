import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/states/page-header";
import { getRouteMeta } from "@/lib/route-meta";
import { withLoading } from "@/components/states/page-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ArrowUpRight, Clock, Mail, MessageCircle, Calendar, Sparkles } from "lucide-react";
import { useCampaigns, useContacts, useDeals, useAITasks, relTime } from "@/hooks/use-growth-data";

const meta = getRouteMeta("/analytics")!;

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };

const STAGE_COLORS: Record<string, string> = {
  prospecting: "#6366f1",
  qualified: "#3b82f6",
  proposal: "#f59e0b",
  negotiation: "#f97316",
  closed_won: "#10b981",
  closed_lost: "#94a3b8",
};
const STAGE_LABEL: Record<string, string> = {
  prospecting: "Prospecting",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Won",
  closed_lost: "Lost",
};

const CHANNEL_COLORS: Record<string, string> = {
  email: "#6366f1",
  linkedin: "#3b82f6",
  whatsapp: "#10b981",
  sms: "#f59e0b",
  call: "#f97316",
  other: "#94a3b8",
};

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-600",
    running: "bg-indigo-500/10 text-indigo-600",
    queued: "bg-amber-500/10 text-amber-600",
    failed: "bg-red-500/10 text-red-600",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "running" ? "bg-indigo-500 animate-pulse" : status === "completed" ? "bg-emerald-500" : "bg-muted-foreground"}`} />
      {status}
    </span>
  );
}

function KpiCard({ label, value, delta, Icon }: { label: string; value: string; delta: string; Icon: React.ComponentType<{ className?: string }> }) {
  const positive = delta.startsWith("+");
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
            <p className={`mt-1 text-xs font-medium ${positive ? "text-emerald-600" : "text-red-600"}`}>{delta} vs prior period</p>
          </div>
          <div className="rounded-xl p-2 bg-gradient-to-br from-[#EEF2FF] to-[#F5F3FF] text-[#6C63FF]">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function pctDelta(cur: number, prev: number): string {
  if (prev === 0) return cur === 0 ? "+0%" : "+100%";
  const d = ((cur - prev) / prev) * 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`;
}

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [
      { title: `${meta.label} · Gallabox GrowthOS` },
      { name: "description", content: meta.description },
    ],
  }),
  component: withLoading(AnalyticsPage, "dashboard"),
});

function AnalyticsPage() {
  const [range, setRange] = useState<string>("30d");
  const days = RANGE_DAYS[range] ?? 30;

  const { data: campaigns = [] } = useCampaigns();
  const { data: contacts = [] } = useContacts();
  const { data: deals = [] } = useDeals();
  const { data: tasks = [] } = useAITasks();

  const now = Date.now();
  const rangeMs = days * 86_400_000;
  const startCur = now - rangeMs;
  const startPrev = now - rangeMs * 2;

  const camp = useMemo(() => {
    const cur = campaigns.filter((c) => new Date(c.created_at).getTime() >= startCur);
    const prev = campaigns.filter((c) => {
      const t = new Date(c.created_at).getTime();
      return t >= startPrev && t < startCur;
    });
    const sum = (arr: typeof campaigns, k: "sent_count" | "open_count" | "reply_count" | "meetings_count") =>
      arr.reduce((s, c) => s + (c[k] ?? 0), 0);
    return {
      sent: sum(cur, "sent_count"), open: sum(cur, "open_count"), reply: sum(cur, "reply_count"), meet: sum(cur, "meetings_count"),
      pSent: sum(prev, "sent_count"), pOpen: sum(prev, "open_count"), pReply: sum(prev, "reply_count"), pMeet: sum(prev, "meetings_count"),
      cur, prev,
    };
  }, [campaigns, startCur, startPrev]);

  const openRate = camp.sent ? (camp.open / camp.sent) * 100 : 0;
  const replyRate = camp.sent ? (camp.reply / camp.sent) * 100 : 0;
  const pOpenRate = camp.pSent ? (camp.pOpen / camp.pSent) * 100 : 0;
  const pReplyRate = camp.pSent ? (camp.pReply / camp.pSent) * 100 : 0;

  const KPIS = [
    { label: "Total Emails Sent", value: camp.sent.toLocaleString(), delta: pctDelta(camp.sent, camp.pSent), Icon: Mail },
    { label: "Avg Open Rate", value: `${openRate.toFixed(1)}%`, delta: pctDelta(openRate, pOpenRate), Icon: ArrowUpRight },
    { label: "Reply Rate", value: `${replyRate.toFixed(1)}%`, delta: pctDelta(replyRate, pReplyRate), Icon: MessageCircle },
    { label: "Meetings Booked", value: camp.meet.toLocaleString(), delta: pctDelta(camp.meet, camp.pMeet), Icon: Calendar },
  ];

  // Weekly bucket over current range
  const WEEKLY = useMemo(() => {
    const weeks = Math.max(4, Math.min(12, Math.ceil(days / 7)));
    const bucketMs = rangeMs / weeks;
    const buckets = Array.from({ length: weeks }, (_, i) => ({ week: `W${i + 1}`, Sent: 0, Opened: 0, Replied: 0 }));
    for (const c of camp.cur) {
      const idx = Math.min(weeks - 1, Math.floor((new Date(c.created_at).getTime() - startCur) / bucketMs));
      if (idx < 0) continue;
      buckets[idx].Sent += c.sent_count ?? 0;
      buckets[idx].Opened += c.open_count ?? 0;
      buckets[idx].Replied += c.reply_count ?? 0;
    }
    return buckets;
  }, [camp.cur, days, rangeMs, startCur]);

  // Leads by channel from campaigns
  const CHANNEL = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of camp.cur) {
      const share = (c.leads_count ?? 0) / Math.max(1, (c.channels ?? []).length || 1);
      for (const ch of c.channels ?? []) counts[ch] = (counts[ch] ?? 0) + share;
    }
    const entries = Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round(value),
      color: CHANNEL_COLORS[name] ?? "#94a3b8",
    }));
    return entries.length ? entries : [{ name: "No data", value: 1, color: "#e5e7eb" }];
  }, [camp.cur]);

  // Deals by stage
  const STAGES = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of deals) counts[d.stage] = (counts[d.stage] ?? 0) + 1;
    const entries = Object.entries(counts).map(([k, v]) => ({
      name: STAGE_LABEL[k] ?? k,
      value: v,
      color: STAGE_COLORS[k] ?? "#94a3b8",
    }));
    return entries.length ? entries : [{ name: "No deals", value: 1, color: "#e5e7eb" }];
  }, [deals]);

  // Open rate trend (per week bucket)
  const OPEN_TREND = useMemo(() => {
    return WEEKLY.map((w) => ({
      week: w.week,
      "Open Rate": w.Sent ? +((w.Opened / w.Sent) * 100).toFixed(1) : 0,
      Benchmark: 28,
    }));
  }, [WEEKLY]);

  // Top sequences (from campaigns in range)
  const SEQUENCES = useMemo(() => {
    return [...camp.cur]
      .sort((a, b) => (b.reply_count ?? 0) - (a.reply_count ?? 0))
      .slice(0, 8)
      .map((c) => ({
        name: c.name,
        leads: c.leads_count ?? 0,
        sent: c.sent_count ?? 0,
        open: c.sent_count ? `${Math.round((c.open_count / c.sent_count) * 100)}%` : "—",
        reply: c.sent_count ? `${Math.round((c.reply_count / c.sent_count) * 100)}%` : "—",
        meetings: c.meetings_count ?? 0,
      }));
  }, [camp.cur]);

  // Pipeline value over time (by stage_entered / created_at month)
  const PIPELINE_TREND = useMemo(() => {
    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = (k: string) => {
      const [y, m] = k.split("-");
      const dt = new Date(Number(y), Number(m) - 1, 1);
      return dt.toLocaleString(undefined, { month: "short" });
    };
    const months: string[] = [];
    const base = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      months.push(monthKey(d));
    }
    const zero = () => ({ Prospecting: 0, Qualified: 0, Proposal: 0, Negotiation: 0, Won: 0 });
    const map: Record<string, ReturnType<typeof zero>> = {};
    months.forEach((m) => (map[m] = zero()));
    for (const d of deals) {
      const key = monthKey(new Date(d.created_at));
      if (!map[key]) continue;
      const label = STAGE_LABEL[d.stage];
      const v = d.value ?? 0;
      if (label === "Won") map[key].Won += v;
      else if (label === "Prospecting") map[key].Prospecting += v;
      else if (label === "Qualified") map[key].Qualified += v;
      else if (label === "Proposal") map[key].Proposal += v;
      else if (label === "Negotiation") map[key].Negotiation += v;
    }
    return months.map((k) => ({ month: monthLabel(k), ...map[k] }));
  }, [deals]);

  // Funnel from contacts + deals
  const FUNNEL = useMemo(() => {
    const leads = contacts.length;
    const qualified = deals.filter((d) => ["qualified", "proposal", "negotiation", "closed_won"].includes(d.stage)).length;
    const proposal = deals.filter((d) => ["proposal", "negotiation", "closed_won"].includes(d.stage)).length;
    const negotiation = deals.filter((d) => ["negotiation", "closed_won"].includes(d.stage)).length;
    const won = deals.filter((d) => d.stage === "closed_won").length;
    const raw = [
      { stage: "Leads", value: leads, color: "bg-indigo-500" },
      { stage: "Qualified", value: qualified, color: "bg-blue-500" },
      { stage: "Proposal", value: proposal, color: "bg-amber-500" },
      { stage: "Negotiation", value: negotiation, color: "bg-orange-500" },
      { stage: "Won", value: won, color: "bg-emerald-500" },
    ];
    const max = Math.max(1, leads);
    return raw.map((r) => ({ ...r, pct: +((r.value / max) * 100).toFixed(1) }));
  }, [contacts, deals]);

  // Agent performance (aggregate from ai_tasks in current range)
  const AGENTS = useMemo(() => {
    const inRange = tasks.filter((t) => new Date(t.created_at).getTime() >= startCur);
    const agg: Record<string, { runs: number; done: number; running: number; last: string | null }> = {};
    for (const t of inRange) {
      const a = (agg[t.agent_name] ??= { runs: 0, done: 0, running: 0, last: null });
      a.runs += 1;
      if (t.status === "completed") a.done += 1;
      if (t.status === "running" || t.status === "queued") a.running += 1;
      if (!a.last || new Date(t.created_at) > new Date(a.last)) a.last = t.created_at;
    }
    return Object.entries(agg)
      .map(([name, s]) => ({
        name,
        runs: s.runs,
        quality: s.runs ? Math.round((s.done / s.runs) * 100) : 0,
        last: s.last ? relTime(s.last) : "—",
        status: s.running ? "running" : s.runs ? "completed" : "queued",
      }))
      .sort((a, b) => b.runs - a.runs);
  }, [tasks, startCur]);

  const totalHoursSaved = useMemo(() => {
    // Estimate: 3 minutes saved per completed AI task
    const completed = tasks.filter((t) => new Date(t.created_at).getTime() >= startCur && t.status === "completed").length;
    return Math.round((completed * 3) / 60);
  }, [tasks, startCur]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operations"
        title="Analytics"
        description="Revenue intelligence and outreach performance — live from your workspace."
        actions={
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          {[
            ["overview", "Overview"],
            ["outreach", "Outreach"],
            ["pipeline", "Pipeline"],
            ["ai", "AI Performance"],
          ].map(([v, l]) => (
            <TabsTrigger
              key={v}
              value={v}
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6C63FF] data-[state=active]:to-[#8B5CF6] data-[state=active]:text-white data-[state=active]:shadow"
            >
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KPIS.map((k) => (
              <KpiCard key={k.label} {...k} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Outreach Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={WEEKLY}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="Sent" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Opened" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Replied" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Leads by Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={CHANNEL} dataKey="value" nameKey="name" outerRadius={90} label>
                        {CHANNEL.map((c) => (
                          <Cell key={c.name} fill={c.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Deals by Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={STAGES} dataKey="value" nameKey="name" outerRadius={90} label>
                        {STAGES.map((c) => (
                          <Cell key={c.name} fill={c.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* OUTREACH */}
        <TabsContent value="outreach" className="mt-6 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Open Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={OPEN_TREND}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Open Rate" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Benchmark" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Sequences</CardTitle>
            </CardHeader>
            <CardContent>
              {SEQUENCES.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No campaigns in this period.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sequence</TableHead>
                      <TableHead>Leads</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Open Rate</TableHead>
                      <TableHead>Reply Rate</TableHead>
                      <TableHead>Meetings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SEQUENCES.map((s) => (
                      <TableRow key={s.name}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.leads}</TableCell>
                        <TableCell>{s.sent.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                            {s.open}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                            {s.reply}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{s.meetings}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PIPELINE */}
        <TabsContent value="pipeline" className="mt-6 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Value Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PIPELINE_TREND}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="Prospecting" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.7} />
                    <Area type="monotone" dataKey="Qualified" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.7} />
                    <Area type="monotone" dataKey="Proposal" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.7} />
                    <Area type="monotone" dataKey="Negotiation" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.7} />
                    <Area type="monotone" dataKey="Won" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {FUNNEL.map((f) => (
                <div key={f.stage} className="flex items-center gap-4">
                  <div className="w-28 shrink-0 text-sm font-medium text-foreground">{f.stage}</div>
                  <div className="flex-1">
                    <div
                      className={`flex h-9 items-center justify-between rounded-md px-3 text-xs font-semibold text-white ${f.color}`}
                      style={{ width: `${Math.max(f.pct, 8)}%`, minWidth: 120 }}
                    >
                      <span>{f.value.toLocaleString()}</span>
                      <span>{f.pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI PERFORMANCE */}
        <TabsContent value="ai" className="mt-6 flex flex-col gap-6">
          <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-transparent">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-gradient-to-br from-[#EEF2FF] to-[#F5F3FF] p-3 text-[#6C63FF]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Estimated time saved by AI this period
                </p>
                <p className="text-2xl font-bold tracking-tight">{totalHoursSaved} hours</p>
              </div>
              <div className="ml-auto hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                <Clock className="h-4 w-4" />
                Based on {tasks.filter((t) => new Date(t.created_at).getTime() >= startCur && t.status === "completed").length} completed tasks
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {AGENTS.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No agent runs in this period.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Tasks Run</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Last Run</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {AGENTS.map((a) => (
                      <TableRow key={a.name}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell>{a.runs.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-indigo-500" style={{ width: `${a.quality}%` }} />
                            </div>
                            <span className="text-xs font-semibold">{a.quality}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{a.last}</TableCell>
                        <TableCell>
                          <StatusPill status={a.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
