import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/states/page-header";
import { getRouteMeta } from "@/lib/route-meta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Linkedin, Eye, StickyNote, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { withLoading } from "@/components/states/page-skeleton";
import { EmptyState } from "@/components/states/empty-state";

const meta = getRouteMeta("/crm")!;

type Deal = {
  company: string;
  contact: string;
  value: string;
  day: number;
  channels: ("email" | "linkedin")[];
  signal: string;
};

type Column = {
  id: string;
  name: string;
  color: string; // tailwind border/bg color class base
  accent: string; // hex-ish for badge text
  count: number;
  total: string;
  deals: Deal[];
};

const COLUMNS: Column[] = [
  {
    id: "prospecting",
    name: "Prospecting",
    color: "bg-indigo-500",
    accent: "text-indigo-600",
    count: 8,
    total: "$1.2M",
    deals: [
      { company: "Notion Labs", contact: "Ivan Zhao", value: "$180K", day: 4, channels: ["email"], signal: "↑ Opened 3 emails this week" },
      { company: "Vercel", contact: "Guillermo Rauch", value: "$220K", day: 7, channels: ["email", "linkedin"], signal: "Visited pricing page twice" },
      { company: "Retool", contact: "David Hsu", value: "$95K", day: 2, channels: ["linkedin"], signal: "New buying committee member" },
    ],
  },
  {
    id: "qualified",
    name: "Qualified",
    color: "bg-blue-500",
    accent: "text-blue-600",
    count: 5,
    total: "$890K",
    deals: [
      { company: "Figma", contact: "Dylan Field", value: "$310K", day: 12, channels: ["email", "linkedin"], signal: "Champion looped in CFO" },
      { company: "Linear", contact: "Karri Saarinen", value: "$140K", day: 9, channels: ["email"], signal: "Requested security review" },
    ],
  },
  {
    id: "proposal",
    name: "Proposal",
    color: "bg-amber-500",
    accent: "text-amber-600",
    count: 4,
    total: "$640K",
    deals: [
      { company: "Ramp", contact: "Eric Glyman", value: "$260K", day: 18, channels: ["email"], signal: "Proposal opened 5 times" },
      { company: "Airtable", contact: "Howie Liu", value: "$175K", day: 21, channels: ["email", "linkedin"], signal: "Legal review in progress" },
    ],
  },
  {
    id: "negotiation",
    name: "Negotiation",
    color: "bg-orange-500",
    accent: "text-orange-600",
    count: 3,
    total: "$520K",
    deals: [
      { company: "Stripe", contact: "Patrick Collison", value: "$340K", day: 26, channels: ["email"], signal: "Redlines returned yesterday" },
      { company: "Loom", contact: "Joe Thomas", value: "$95K", day: 31, channels: ["linkedin"], signal: "Champion went dark 4 days" },
    ],
  },
  {
    id: "won",
    name: "Closed Won",
    color: "bg-emerald-500",
    accent: "text-emerald-600",
    count: 6,
    total: "$980K",
    deals: [
      { company: "Superhuman", contact: "Rahul Vohra", value: "$210K", day: 42, channels: ["email", "linkedin"], signal: "Signed — kickoff Monday" },
      { company: "Perplexity", contact: "Aravind Srinivas", value: "$155K", day: 38, channels: ["email"], signal: "Expansion opportunity flagged" },
    ],
  },
];

function ChannelIcon({ type }: { type: "email" | "linkedin" }) {
  const Icon = type === "email" ? Mail : Linkedin;
  return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <div className="group rounded-lg border border-border/60 bg-card p-3 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{deal.company}</p>
          <p className="truncate text-xs text-muted-foreground">{deal.contact}</p>
        </div>
        <Badge className="border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400">
          {deal.value}
        </Badge>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          Day {deal.day}
        </span>
        <div className="flex items-center gap-1">
          {deal.channels.map((c) => (
            <ChannelIcon key={c} type={c} />
          ))}
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
        {deal.signal}
      </p>
      <div className="mt-2 hidden gap-2 group-hover:flex">
        <Button variant="outline" size="sm" className="h-7 flex-1 text-xs">
          <Eye className="h-3 w-3" /> View
        </Button>
        <Button variant="outline" size="sm" className="h-7 flex-1 text-xs">
          <StickyNote className="h-3 w-3" /> Note
        </Button>
      </div>
    </div>
  );
}

function KanbanColumn({ column }: { column: Column }) {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/40">
      <div className={cn("h-1 rounded-t-xl", column.color)} />
      <div className="flex items-center justify-between px-3 pt-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{column.name}</p>
          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {column.count}
          </span>
        </div>
        <span className={cn("text-xs font-semibold", column.accent)}>{column.total}</span>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {column.deals.map((d) => (
          <DealCard key={d.company} deal={d} />
        ))}
        <Button variant="ghost" size="sm" className="h-8 justify-start text-xs text-muted-foreground">
          <Plus className="h-3.5 w-3.5" /> Add Deal
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_app/crm")({
  head: () => ({
    meta: [
      { title: `${meta.label} · Gallabox GrowthOS` },
      { name: "description", content: meta.description },
    ],
  }),
  component: withLoading(CrmPage, "kanban"),
});

function CrmPage() {
  const hasDeals = COLUMNS.some((c) => c.deals.length > 0);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operations"
        title="CRM"
        description="Your revenue pipeline at a glance."
        actions={
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Add Deal
          </Button>
        }
      />
      {hasDeals ? (
        <div className="-mx-2 overflow-x-auto pb-4">
          <div className="flex min-w-max gap-4 px-2">
            {COLUMNS.map((c) => (
              <KanbanColumn key={c.id} column={c} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={TrendingUp}
          title="Pipeline is empty"
          description="Add your first deal to start tracking revenue."
          action={
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> Add Deal
            </Button>
          }
        />
      )}
    </div>
  );
}
