import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/states/page-header";
import { getRouteMeta } from "@/lib/route-meta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Linkedin, Eye, StickyNote, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { withLoading, PageSkeleton } from "@/components/states/page-skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { useDeals, type DealRow } from "@/hooks/use-growth-data";

const meta = getRouteMeta("/crm")!;

type ColumnMeta = { id: string; name: string; color: string; accent: string };

const COLUMN_ORDER: ColumnMeta[] = [
  { id: "prospecting", name: "Prospecting", color: "bg-indigo-500", accent: "text-indigo-600" },
  { id: "qualified", name: "Qualified", color: "bg-blue-500", accent: "text-blue-600" },
  { id: "proposal", name: "Proposal", color: "bg-amber-500", accent: "text-amber-600" },
  { id: "negotiation", name: "Negotiation", color: "bg-orange-500", accent: "text-orange-600" },
  { id: "won", name: "Closed Won", color: "bg-emerald-500", accent: "text-emerald-600" },
];

function formatValue(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function ChannelIcon({ type }: { type: string }) {
  const Icon = type === "email" ? Mail : Linkedin;
  return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
}

function DealCard({ deal }: { deal: DealRow }) {
  return (
    <div className="group rounded-lg border border-border/60 bg-card p-3 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{deal.company_name}</p>
        </div>
        <Badge className="border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400">
          {formatValue(deal.value)}
        </Badge>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          Day {deal.days_in_stage}
        </span>
        <div className="flex items-center gap-1">
          {deal.channels.map((c) => (
            <ChannelIcon key={c} type={c} />
          ))}
        </div>
      </div>
      {deal.ai_signal && (
        <p className="mt-2 line-clamp-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
          {deal.ai_signal}
        </p>
      )}
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

function KanbanColumn({ column, deals }: { column: ColumnMeta; deals: DealRow[] }) {
  const total = deals.reduce((s, d) => s + (d.value ?? 0), 0);
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/40">
      <div className={cn("h-1 rounded-t-xl", column.color)} />
      <div className="flex items-center justify-between px-3 pt-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{column.name}</p>
          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {deals.length}
          </span>
        </div>
        <span className={cn("text-xs font-semibold", column.accent)}>{formatValue(total)}</span>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} />
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
  const { data: deals, isLoading } = useDeals();

  const grouped = useMemo(() => {
    const map: Record<string, DealRow[]> = {};
    for (const col of COLUMN_ORDER) map[col.id] = [];
    for (const d of deals ?? []) {
      if (map[d.stage]) map[d.stage].push(d);
    }
    return map;
  }, [deals]);

  const hasDeals = (deals?.length ?? 0) > 0;

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
      {isLoading ? (
        <PageSkeleton variant="kanban" />
      ) : hasDeals ? (
        <div className="-mx-2 overflow-x-auto pb-4">
          <div className="flex min-w-max gap-4 px-2">
            {COLUMN_ORDER.map((col) => (
              <KanbanColumn key={col.id} column={col} deals={grouped[col.id]} />
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
