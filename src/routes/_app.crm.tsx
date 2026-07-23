import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";
import { PageHeader } from "@/components/states/page-header";
import { getRouteMeta } from "@/lib/route-meta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Mail,
  Linkedin,
  MessageCircle,
  MoreHorizontal,
  TrendingUp,
  ArrowUpDown,
  Search,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { withLoading, PageSkeleton } from "@/components/states/page-skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { useDeals, type DealRow } from "@/hooks/use-growth-data";
import { useProfile } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const meta = getRouteMeta("/crm")!;

type ColumnMeta = {
  id: string;
  name: string;
  bar: string;
  accent: string;
};

const COLUMN_ORDER: ColumnMeta[] = [
  { id: "prospecting", name: "Prospecting", bar: "bg-gradient-to-r from-primary to-brand-end", accent: "text-primary" },
  { id: "qualified", name: "Qualified", bar: "bg-gradient-to-r from-primary to-brand-end", accent: "text-primary" },
  { id: "proposal", name: "Proposal", bar: "bg-gradient-to-r from-primary to-brand-end", accent: "text-primary" },
  { id: "negotiation", name: "Negotiation", bar: "bg-gradient-to-r from-primary to-brand-end", accent: "text-primary" },
  { id: "closed_won", name: "Closed Won", bar: "bg-gradient-to-r from-success to-primary", accent: "text-success" },
];

const STAGE_LABEL: Record<string, string> = {
  prospecting: "Prospecting",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

const CHANNEL_OPTIONS = [
  { id: "email", label: "Email" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "whatsapp", label: "WhatsApp" },
];

function formatValue(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `₹${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
}

function ChannelIcon({ type }: { type: string }) {
  const Icon = type === "email" ? Mail : type === "linkedin" ? Linkedin : MessageCircle;
  return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
}

export const Route = createFileRoute("/_app/crm")({
  head: () => ({
    meta: [
      { title: `₹{meta.label} · Gallabox GrowthOS` },
      { name: "description", content: meta.description },
    ],
  }),
  component: withLoading(CrmPage, "kanban"),
});

function CrmPage() {
  const { data: deals, isLoading } = useDeals();
  const { data: profile } = useProfile();
  const workspaceId = profile?.workspace_id;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [wonDealId, setWonDealId] = useState<string | null>(null);

  // Mock deal seeder removed — CRM now shows real workspace data only.


  // Add-deal dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addStage, setAddStage] = useState<string>("prospecting");
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    value: "",
    stage: "prospecting",
    channels: ["email"] as string[],
  });

  // Detail sheet
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedDeal = useMemo(
    () => (deals ?? []).find((d) => d.id === selectedId) ?? null,
    [deals, selectedId],
  );

  const openAdd = (stage: string) => {
    setAddStage(stage);
    setForm({
      companyName: "",
      contactName: "",
      value: "",
      stage,
      channels: ["email"],
    });
    setAddOpen(true);
  };

  const handleCreate = async () => {
    if (!form.companyName.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (!workspaceId) {
      toast.error("No workspace found");
      return;
    }
    const { error } = await supabase.from("deals").insert({
      company_name: form.companyName.trim(),
      contact_id: null,
      workspace_id: workspaceId,
      value: form.value ? parseFloat(form.value) : null,
      stage: form.stage,
      channels: form.channels,
      days_in_stage: 0,
      ai_signal: "New deal added",
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deal added to pipeline");
    queryClient.invalidateQueries({ queryKey: ["deals", workspaceId] });
    setAddOpen(false);
  };

  const handleMoveStage = async (dealId: string, newStage: string) => {
    const { error } = await supabase
      .from("deals")
      .update({ stage: newStage, days_in_stage: 0 })
      .eq("id", dealId);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["deals", workspaceId] });
    toast.success(`Deal moved to ${STAGE_LABEL[newStage] ?? newStage}`);
    if (newStage === "closed_won") {
      setWonDealId(dealId);
      setTimeout(() => setWonDealId(null), 3000);
    }
  };

  const filteredDeals = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (deals ?? [])
      .filter((d) => (q ? (d.company_name ?? "").toLowerCase().includes(q) : true))
      .sort((a, b) =>
        sortDir === "desc" ? (b.value ?? 0) - (a.value ?? 0) : (a.value ?? 0) - (b.value ?? 0),
      );
  }, [deals, search, sortDir]);

  const grouped = useMemo(() => {
    const map: Record<string, DealRow[]> = {};
    for (const col of COLUMN_ORDER) map[col.id] = [];
    for (const d of filteredDeals) {
      if (map[d.stage]) map[d.stage].push(d);
    }
    return map;
  }, [filteredDeals]);

  const hasDeals = (deals?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operations"
        title="CRM"
        description="Your revenue pipeline at a glance."
        actions={
          <Button
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => openAdd("prospecting")}
          >
            <Plus className="h-4 w-4" /> Add Deal
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals by company..."
            className="pl-8"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
        >
          <ArrowUpDown className="h-4 w-4" />
          Sort by Value: {sortDir === "desc" ? "High → Low" : "Low → High"}
        </Button>
      </div>

      {isLoading ? (
        <PageSkeleton variant="kanban" />
      ) : hasDeals ? (
        <div className="-mx-2 overflow-x-auto pb-4">
          <div className="flex min-w-max gap-4 px-2">
            {COLUMN_ORDER.map((col) => {
              const colDeals = grouped[col.id];
              const colValue = colDeals.reduce((s, d) => s + (d.value ?? 0), 0);
              return (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  deals={colDeals}
                  totalLabel={formatValue(colValue)}
                  wonDealId={wonDealId}
                  onAdd={() => openAdd(col.id)}
                  onMove={handleMoveStage}
                  onOpen={(id) => setSelectedId(id)}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={TrendingUp}
          title="Pipeline is empty"
          description="Add your first deal to start tracking revenue."
          action={
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => openAdd("prospecting")}
            >
              <Plus className="h-4 w-4" /> Add Deal
            </Button>
          }
        />
      )}

      {/* Add Deal Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Deal</DialogTitle>
            <DialogDescription>
              Create a new deal in the {STAGE_LABEL[addStage]} stage.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="Acme Corp"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact">Contact Name</Label>
              <Input
                id="contact"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                placeholder="Jane Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="value">Deal Value</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="value"
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="10000"
                  className="pl-6"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Stage</Label>
              <Select
                value={form.stage}
                onValueChange={(v) => setForm({ ...form, stage: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMN_ORDER.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Channels</Label>
              <div className="flex gap-4">
                {CHANNEL_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={form.channels.includes(opt.id)}
                      onCheckedChange={(v) => {
                        setForm((f) => ({
                          ...f,
                          channels: v
                            ? [...f.channels, opt.id]
                            : f.channels.filter((c) => c !== opt.id),
                        }));
                      }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={handleCreate}
            >
              Create Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet
        open={!!selectedDeal}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto">
          {selectedDeal && (
            <DealDetail
              deal={selectedDeal}
              workspaceId={workspaceId}
              onClose={() => setSelectedId(null)}
              onMove={handleMoveStage}
              navigate={navigate}
              queryClient={queryClient}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function KanbanColumn({
  column,
  deals,
  totalLabel,
  wonDealId,
  onAdd,
  onMove,
  onOpen,
}: {
  column: ColumnMeta;
  deals: DealRow[];
  totalLabel: string;
  wonDealId: string | null;
  onAdd: () => void;
  onMove: (id: string, stage: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/40">
      <div className={cn("h-1 rounded-t-xl", column.bar)} />
      <div className="flex items-center justify-between px-3 pt-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{column.name}</p>
          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {deals.length}
          </span>
        </div>
        <span className={cn("text-xs font-semibold", column.accent)}>{totalLabel}</span>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {deals.map((d) => (
          <DealCard
            key={d.id}
            deal={d}
            isWon={wonDealId === d.id}
            onMove={onMove}
            onOpen={onOpen}
          />
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 justify-start text-xs text-muted-foreground"
          onClick={onAdd}
        >
          <Plus className="h-3.5 w-3.5" /> Add Deal
        </Button>
      </div>
    </div>
  );
}

function DealCard({
  deal,
  isWon,
  onMove,
  onOpen,
}: {
  deal: DealRow;
  isWon: boolean;
  onMove: (id: string, stage: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-lg border border-border/60 bg-card p-3 shadow-sm transition hover:shadow-md",
        isWon && "ring-2 ring-emerald-400 bg-emerald-50/10",
      )}
    >
      {isWon && (
        <Badge className="absolute -top-2 -right-2 border-transparent bg-emerald-500 text-white hover:bg-emerald-500">
          <PartyPopper className="h-3 w-3" /> Won!
        </Badge>
      )}
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onOpen(deal.id)}
        >
          <p className="truncate text-sm font-semibold text-foreground hover:text-indigo-600">
            {deal.company_name}
          </p>
        </button>
        <div className="flex items-center gap-1">
          <Badge className="border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400">
            {formatValue(deal.value)}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded p-1 opacity-0 transition group-hover:opacity-100 hover:bg-muted"
                aria-label="Deal actions"
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Move to →</DropdownMenuLabel>
              {COLUMN_ORDER.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  disabled={c.id === deal.stage}
                  onClick={() => onMove(deal.id, c.id)}
                >
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
    </div>
  );
}

function DealDetail({
  deal,
  workspaceId,
  onClose,
  onMove,
  navigate,
  queryClient,
}: {
  deal: DealRow & { notes?: string | null };
  workspaceId: string | null | undefined;
  onClose: () => void;
  onMove: (id: string, stage: string) => void;
  navigate: ReturnType<typeof useNavigate>;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [aiSignal, setAiSignal] = useState(deal.ai_signal ?? "");
  const [editingSignal, setEditingSignal] = useState(false);
  const [notes, setNotes] = useState<string>((deal as any).notes ?? "");
  const [savedTick, setSavedTick] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialNotes = useRef(true);

  useEffect(() => {
    setAiSignal(deal.ai_signal ?? "");
    setNotes((deal as any).notes ?? "");
    isInitialNotes.current = true;
  }, [deal.id]);

  useEffect(() => {
    if (isInitialNotes.current) {
      isInitialNotes.current = false;
      return;
    }
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      const { error } = await supabase
        .from("deals")
        .update({ notes })
        .eq("id", deal.id);
      if (!error) {
        setSavedTick(true);
        setTimeout(() => setSavedTick(false), 1500);
      }
    }, 500);
    return () => {
      if (notesTimer.current) clearTimeout(notesTimer.current);
    };
  }, [notes, deal.id]);

  const saveSignal = async () => {
    setEditingSignal(false);
    if (aiSignal === (deal.ai_signal ?? "")) return;
    await supabase.from("deals").update({ ai_signal: aiSignal }).eq("id", deal.id);
    queryClient.invalidateQueries({ queryKey: ["deals", workspaceId] });
  };

  const changeStage = async (value: string) => {
    await supabase.from("deals").update({ stage: value }).eq("id", deal.id);
    queryClient.invalidateQueries({ queryKey: ["deals", workspaceId] });
    toast.success(`Stage updated to ${STAGE_LABEL[value] ?? value}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <SheetHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <SheetTitle className="text-xl font-bold">{deal.company_name}</SheetTitle>
          <Badge className="border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400">
            {formatValue(deal.value)}
          </Badge>
        </div>
      </SheetHeader>

      <div className="grid gap-2">
        <Label>Stage</Label>
        <Select value={deal.stage} onValueChange={changeStage}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLUMN_ORDER.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
            <SelectItem value="closed_lost">Closed Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Days in stage: <span className="font-medium text-foreground">{deal.days_in_stage}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Channels:</span>
          {deal.channels.map((c) => (
            <ChannelIcon key={c} type={c} />
          ))}
        </div>
      </div>

      <div className="rounded-lg border-l-4 border-indigo-500 bg-indigo-50/40 dark:bg-indigo-500/5 p-3">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          AI Signal
        </p>
        {editingSignal ? (
          <Input
            autoFocus
            value={aiSignal}
            onChange={(e) => setAiSignal(e.target.value)}
            onBlur={saveSignal}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
        ) : (
          <p
            className="cursor-text text-sm text-foreground"
            onClick={() => setEditingSignal(true)}
          >
            {aiSignal || <span className="text-muted-foreground italic">Click to add signal</span>}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="notes">Notes</Label>
          {savedTick && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">Saved ✓</span>
          )}
        </div>
        <Textarea
          id="notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this deal..."
        />
      </div>

      <DealActivityFeed dealId={deal.id} workspaceId={workspaceId} />


      <div className="flex flex-col gap-2 pt-2">
        <Button
          className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
          onClick={() => navigate({ to: "/outreach-studio" })}
        >
          Draft Outreach
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate({ to: "/campaign-studio" })}
        >
          Add to Campaign
        </Button>
        <Button
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={async () => {
            await onMove(deal.id, "closed_won");
            onClose();
          }}
        >
          Mark as Won
        </Button>
        <Button
          variant="outline"
          className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={async () => {
            await onMove(deal.id, "closed_lost");
            onClose();
          }}
        >
          Mark as Lost
        </Button>
      </div>
    </div>
  );
}

type DealActivity = {
  id: string;
  actor_type: string;
  actor_name: string | null;
  action: string;
  description: string | null;
  created_at: string;
};

function actorEmoji(actor_type: string, action: string) {
  if (actor_type === "ai") return "🤖";
  if (actor_type === "system") return "⚙️";
  if (action.startsWith("stage.")) return "🔀";
  if (action === "deal.created") return "✨";
  if (action === "note.added") return "📝";
  return "👤";
}

function relTime(iso: string) {
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `₹{m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `₹{h}h ago`;
  const d = Math.floor(h / 24);
  return `₹{d}d ago`;
}

function DealActivityFeed({
  dealId,
  workspaceId,
}: {
  dealId: string;
  workspaceId: string | null | undefined;
}) {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [posting, setPosting] = useState(false);

  const { data: activities } = useQuery({
    queryKey: ["deal_activities", dealId],
    enabled: !!dealId,
    queryFn: async (): Promise<DealActivity[]> => {
      const { data, error } = await (supabase as any)
        .from("deal_activities")
        .select("id, actor_type, actor_name, action, description, created_at")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return (data ?? []) as DealActivity[];
    },
  });

  useEffect(() => {
    if (!dealId) return;
    const channel = supabase
      .channel(`deal-activity-${dealId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deal_activities", filter: `deal_id=eq.${dealId}` },
        () => queryClient.invalidateQueries({ queryKey: ["deal_activities", dealId] }),
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [dealId, queryClient]);

  const addNote = async () => {
    if (!note.trim() || !workspaceId) return;
    setPosting(true);
    const { error } = await (supabase as any).from("deal_activities").insert({
      workspace_id: workspaceId,
      deal_id: dealId,
      actor_type: "user",
      actor_name: profile?.full_name ?? profile?.email ?? "User",
      action: "note.added",
      description: note.trim(),
    });
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNote("");
    queryClient.invalidateQueries({ queryKey: ["deal_activities", dealId] });
  };

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Activity log
      </p>
      <div className="mb-3 flex gap-2">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Log an activity (call, meeting, note)..."
          onKeyDown={(e) => {
            if (e.key === "Enter") addNote();
          }}
        />
        <Button size="sm" disabled={posting || !note.trim()} onClick={addNote}>
          Log
        </Button>
      </div>
      <ul className="space-y-2 text-sm">
        {(activities ?? []).length === 0 && (
          <li className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            No activity yet. Stage changes and notes will appear here automatically.
          </li>
        )}
        {(activities ?? []).map((a) => (
          <li key={a.id} className="rounded-md bg-muted/40 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">
                {actorEmoji(a.actor_type, a.action)}{" "}
                <span className="font-medium">{a.description ?? a.action}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{relTime(a.created_at)}</span>
            </div>
            {a.actor_name && (
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                by {a.actor_name} · {a.actor_type}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

