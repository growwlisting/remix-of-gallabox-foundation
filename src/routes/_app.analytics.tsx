import { createFileRoute } from "@tanstack/react-router";
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

const meta = getRouteMeta("/analytics")!;

const KPIS = [
  { label: "Total Emails Sent", value: "12,847", delta: "+18%", icon: Mail, tint: "bg-gradient-to-br from-[#EEF2FF] to-[#F5F3FF] text-[#6C63FF]" },
  { label: "Avg Open Rate", value: "34%", delta: "+4%", icon: ArrowUpRight, tint: "bg-gradient-to-br from-[#EEF2FF] to-[#F5F3FF] text-[#6C63FF]" },
  { label: "Reply Rate", value: "9.2%", delta: "+1.2%", icon: MessageCircle, tint: "bg-gradient-to-br from-[#EEF2FF] to-[#F5F3FF] text-[#6C63FF]" },
  { label: "Meetings Booked", value: "147", delta: "+23%", icon: Calendar, tint: "bg-gradient-to-br from-[#EEF2FF] to-[#F5F3FF] text-[#6C63FF]" },
];

const WEEKLY = Array.from({ length: 8 }).map((_, i) => {
  const sent = 1200 + i * 180 + (i % 2 === 0 ? 120 : -40);
  const opened = Math.round(sent * (0.28 + i * 0.008));
  const replied = Math.round(sent * (0.07 + i * 0.003));
  return { week: `W${i + 1}`, Sent: sent, Opened: opened, Replied: replied };
});

const CHANNEL = [
  { name: "Email", value: 45, color: "#6366f1" },
  { name: "LinkedIn", value: 30, color: "#3b82f6" },
  { name: "WhatsApp", value: 15, color: "#10b981" },
  { name: "Other", value: 10, color: "#94a3b8" },
];

const STAGES = [
  { name: "Prospecting", value: 35, color: "#6366f1" },
  { name: "Qualified", value: 22, color: "#3b82f6" },
  { name: "Proposal", value: 18, color: "#f59e0b" },
  { name: "Negotiation", value: 12, color: "#f97316" },
  { name: "Won", value: 13, color: "#10b981" },
];

const OPEN_TREND = Array.from({ length: 12 }).map((_, i) => ({
  week: `W${i + 1}`,
  "Open Rate": 26 + i * 0.7 + (i % 3 === 0 ? 2 : 0),
  Benchmark: 24 + i * 0.15,
}));

const SEQUENCES = [
  { name: "Enterprise SaaS Q3", leads: 420, sent: 1680, open: "42%", reply: "12%", meetings: 28 },
  { name: "SMB Re-engagement", leads: 312, sent: 936, open: "38%", reply: "9%", meetings: 18 },
  { name: "Series B Founders", leads: 180, sent: 540, open: "51%", reply: "14%", meetings: 22 },
  { name: "Churn Win-back", leads: 156, sent: 468, open: "28%", reply: "5%", meetings: 6 },
  { name: "Post-webinar Follow-up", leads: 240, sent: 720, open: "46%", reply: "11%", meetings: 14 },
];

const PIPELINE_TREND = Array.from({ length: 6 }).map((_, i) => {
  const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i];
  return {
    month: m,
    Prospecting: 400 + i * 40,
    Qualified: 300 + i * 30,
    Proposal: 220 + i * 25,
    Negotiation: 160 + i * 18,
    Won: 120 + i * 22,
  };
});

const FUNNEL = [
  { stage: "Leads", value: 4200, pct: 100, color: "bg-indigo-500" },
  { stage: "Qualified", value: 1680, pct: 40, color: "bg-blue-500" },
  { stage: "Proposal", value: 840, pct: 20, color: "bg-amber-500" },
  { stage: "Negotiation", value: 336, pct: 8, color: "bg-orange-500" },
  { stage: "Won", value: 147, pct: 3.5, color: "bg-emerald-500" },
];

const AGENTS = [
  { name: "Sales Strategist", runs: 342, quality: 94, saved: "72h", status: "Ready" },
  { name: "ICP Builder", runs: 128, quality: 91, saved: "48h", status: "Ready" },
  { name: "Persona Builder", runs: 96, quality: 89, saved: "36h", status: "Ready" },
  { name: "Company Research", runs: 512, quality: 92, saved: "96h", status: "Running" },
  { name: "Website Analyzer", runs: 284, quality: 88, saved: "52h", status: "Ready" },
  { name: "Buying Signals", runs: 618, quality: 95, saved: "84h", status: "Running" },
  { name: "Lead Scoring", runs: 1204, quality: 93, saved: "112h", status: "Ready" },
  { name: "Outreach Writer", runs: 892, quality: 90, saved: "128h", status: "Running" },
  { name: "WhatsApp Agent", runs: 412, quality: 87, saved: "44h", status: "Ready" },
  { name: "LinkedIn Agent", runs: 356, quality: 86, saved: "38h", status: "Idle" },
  { name: "Campaign Builder", runs: 148, quality: 92, saved: "62h", status: "Ready" },
  { name: "Meeting Coach", runs: 74, quality: 91, saved: "18h", status: "Idle" },
  { name: "Analytics Agent", runs: 236, quality: 94, saved: "42h", status: "Ready" },
  { name: "Workflow Builder", runs: 62, quality: 89, saved: "12h", status: "Idle" },
  { name: "Memory Manager", runs: 184, quality: 96, saved: "22h", status: "Ready" },
];

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Ready: "bg-emerald-500/10 text-emerald-600",
    Running: "bg-indigo-500/10 text-indigo-600",
    Idle: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "Ready" ? "bg-emerald-500" : status === "Running" ? "bg-indigo-500 animate-pulse" : "bg-muted-foreground"}`} />
      {status}
    </span>
  );
}

function KpiCard({ kpi }: { kpi: (typeof KPIS)[number] }) {
  const Icon = kpi.icon;
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{kpi.value}</p>
            <p className="mt-1 text-xs font-medium text-emerald-600">{kpi.delta} vs last period</p>
          </div>
          <div className={`rounded-xl p-2 ${kpi.tint}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operations"
        title="Analytics"
        description="Revenue intelligence and outreach performance."
        actions={
          <Select defaultValue="30d">
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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="ai">AI Performance</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KPIS.map((k) => (
              <KpiCard key={k.label} kpi={k} />
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
                      style={{ width: `${f.pct}%`, minWidth: 120 }}
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
              <div className="rounded-lg bg-indigo-500/15 p-3 text-indigo-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total time saved by AI this month
                </p>
                <p className="text-2xl font-bold tracking-tight">847 hours</p>
              </div>
              <div className="ml-auto hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                <Clock className="h-4 w-4" />
                Equivalent to ~5 full-time SDRs
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Tasks Run</TableHead>
                    <TableHead>Avg Quality Score</TableHead>
                    <TableHead>Time Saved</TableHead>
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
                          <span className="text-xs font-semibold">{a.quality}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-600">{a.saved}</TableCell>
                      <TableCell>
                        <StatusPill status={a.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
