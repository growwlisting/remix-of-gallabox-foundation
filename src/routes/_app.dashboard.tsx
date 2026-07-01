import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  DollarSign,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/states/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getRouteMeta } from "@/lib/route-meta";
import { cn } from "@/lib/utils";
import { withLoading } from "@/components/states/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useAITasks, relTime } from "@/hooks/use-growth-data";

const meta = getRouteMeta("/dashboard")!;

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: `${meta.label} · Gallabox GrowthOS` },
      { name: "description", content: meta.description },
    ],
  }),
  component: withLoading(DashboardPage, "dashboard"),
});

type Stat = {
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
  iconClass: string;
};

const STATS: Stat[] = [
  {
    label: "Pipeline Value",
    value: "$2.4M",
    change: 12,
    icon: TrendingUp,
    iconClass: "bg-indigo-500/10 text-indigo-500",
  },
  {
    label: "Active Leads",
    value: "1,284",
    change: 8,
    icon: Users,
    iconClass: "bg-green-500/10 text-green-500",
  },
  {
    label: "Meetings Booked",
    value: "47",
    change: 23,
    icon: Calendar,
    iconClass: "bg-blue-500/10 text-blue-500",
  },
  {
    label: "Won This Month",
    value: "$340K",
    change: 5,
    icon: DollarSign,
    iconClass: "bg-emerald-500/10 text-emerald-500",
  },
];

const PIPELINE_DATA = [
  { month: "Jan", created: 320, closed: 140 },
  { month: "Feb", created: 410, closed: 190 },
  { month: "Mar", created: 380, closed: 210 },
  { month: "Apr", created: 520, closed: 260 },
  { month: "May", created: 610, closed: 300 },
  { month: "Jun", created: 720, closed: 340 },
];

type ActivityKind = "Meeting" | "Deal" | "Lead" | "Email";

const KIND_STYLES: Record<ActivityKind, string> = {
  Meeting: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-transparent",
  Deal: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  Lead: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-transparent",
  Email: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
};

function statusKind(status: string): ActivityKind {
  const s = status.toLowerCase();
  if (s === "running") return "Email";
  if (s === "failed") return "Meeting";
  return "Deal";
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "running") return "bg-indigo-500";
  if (s === "failed") return "bg-rose-500";
  return "bg-emerald-500";
}

const INSIGHTS: {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
  iconClass: string;
}[] = [
  {
    icon: Flame,
    title: "18 deals stalled >14 days — re-engage now",
    description: "AI drafted personalized nudges ready to send from Outreach Studio.",
    accent: "border-l-rose-500",
    iconClass: "bg-rose-500/10 text-rose-500",
  },
  {
    icon: Target,
    title: "Top ICP match: SaaS companies 50–200 employees",
    description: "142 new accounts detected this week that mirror your best customers.",
    accent: "border-l-amber-500",
    iconClass: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: Sparkles,
    title: "Email open rate up 31% this week",
    description: "Subject line variant B is outperforming — promote to primary sequence?",
    accent: "border-l-emerald-500",
    iconClass: "bg-emerald-500/10 text-emerald-500",
  },
];

function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon;
  const positive = stat.change >= 0;
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", stat.iconClass)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold",
              positive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {Math.abs(stat.change)}%
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineChart() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Pipeline Overview</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Last 6 months</p>
        </div>
        <Badge variant="secondary" className="font-medium">
          Jan – Jun
        </Badge>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={PIPELINE_DATA} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="pipelineCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pipelineClosed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [`$${value}k`, ""]}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
              <Area
                type="monotone"
                dataKey="created"
                name="Pipeline Created"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#pipelineCreated)"
              />
              <Area
                type="monotone"
                dataKey="closed"
                name="Revenue Closed"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#pipelineClosed)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivity() {
  const { data: tasks, isLoading } = useAITasks();
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-2 py-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))
        ) : (tasks?.length ?? 0) === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          (tasks ?? []).slice(0, 6).map((t) => {
            const kind = statusKind(t.status);
            return (
              <div
                key={t.id}
                className="flex items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className={cn("text-sm font-semibold text-white", statusColor(t.status))}>
                    {t.agent_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{t.task_description}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.agent_name} · {relTime(t.created_at)}
                  </p>
                </div>
                <Badge variant="outline" className={cn("text-xs", KIND_STYLES[kind])}>
                  {t.status}
                </Badge>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}


function AiInsights() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {INSIGHTS.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <div
              key={i}
              className={cn(
                "flex gap-3 rounded-lg border border-border border-l-4 bg-card p-4 transition-shadow hover:shadow-sm",
                insight.accent,
              )}
            >
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", insight.iconClass)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug text-foreground">{insight.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  return (
    <>
      <PageHeader eyebrow="Overview" title={meta.label} description={meta.description} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>
      <PipelineChart />
      <div className="grid gap-4 lg:grid-cols-5">
        <RecentActivity />
        <AiInsights />
      </div>
    </>
  );
}
