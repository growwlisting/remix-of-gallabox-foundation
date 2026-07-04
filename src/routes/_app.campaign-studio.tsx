import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Mail,
  Linkedin,
  MessageCircle,
  MoreHorizontal,
  Eye,
  Activity,
  Clock,
  Send,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  FileEdit,
  Copy,
  Trash2,
  Users,
  TrendingUp,
  Calendar,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/states/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getRouteMeta } from "@/lib/route-meta";
import { withLoading, PageSkeleton } from "@/components/states/page-skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { useCampaigns } from "@/hooks/use-growth-data";
import { useProfile } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const meta = getRouteMeta("/campaign-studio")!;

export const Route = createFileRoute("/_app/campaign-studio")({
  head: () => ({
    meta: [
      { title: `${meta.label} · Gallabox GrowthOS` },
      { name: "description", content: meta.description },
    ],
  }),
  component: withLoading(CampaignStudioPage, "grid"),
});

type CampaignStatus = "Active" | "Draft" | "Paused" | "Completed";
type ChannelKey = "email" | "linkedin" | "whatsapp";

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  channels: ChannelKey[];
  leads: number;
  sent: number;
  openCount: number;
  replyCount: number;
  meetings: number;
  openedPct: number;
  repliedPct: number;
  progress: number;
  lastActivity: string;
  createdAt: string;
}

const STATUS_STYLES: Record<CampaignStatus, string> = {
  Active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  Draft: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-transparent",
  Paused: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
  Completed: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-transparent",
};

const STATUS_ICON: Record<CampaignStatus, React.ElementType> = {
  Active: CheckCircle2,
  Draft: FileEdit,
  Paused: PauseCircle,
  Completed: CheckCircle2,
};

function normalizeStatus(s: string): CampaignStatus {
  const v = (s || "").toLowerCase();
  if (v === "active") return "Active";
  if (v === "paused") return "Paused";
  if (v === "completed") return "Completed";
  return "Draft";
}

function ChannelIcons({ channels }: { channels: ChannelKey[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {channels.includes("email") && (
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10" title="Email">
          <Mail className="h-3.5 w-3.5 text-indigo-500" />
        </div>
      )}
      {channels.includes("linkedin") && (
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10" title="LinkedIn">
          <Linkedin className="h-3.5 w-3.5 text-blue-500" />
        </div>
      )}
      {channels.includes("whatsapp") && (
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10" title="WhatsApp">
          <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
        </div>
      )}
    </div>
  );
}

function relTimeShort(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

/* ---------------- Actions (DB) ---------------- */

function useCampaignActions() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const wid = profile?.workspace_id;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["campaigns", wid] });

  return {
    async setStatus(id: string, status: string) {
      const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
      if (error) return toast.error(error.message);
      toast.success(`Campaign ${status}`);
      invalidate();
    },
    async remove(id: string) {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) return toast.error(error.message);
      toast.success("Campaign deleted");
      invalidate();
    },
    async duplicate(c: Campaign) {
      if (!wid) return;
      const { error } = await supabase.from("campaigns").insert({
        workspace_id: wid,
        name: `${c.name} (copy)`,
        status: "draft",
        channels: c.channels,
        leads_count: c.leads,
        sent_count: 0,
        open_count: 0,
        reply_count: 0,
        meetings_count: 0,
      });
      if (error) return toast.error(error.message);
      toast.success("Campaign duplicated");
      invalidate();
    },
    async create(payload: { name: string; channels: ChannelKey[]; leads: number; status: string }) {
      if (!wid) return toast.error("No workspace");
      const { error } = await supabase.from("campaigns").insert({
        workspace_id: wid,
        name: payload.name,
        status: payload.status,
        channels: payload.channels,
        leads_count: payload.leads,
        sent_count: 0,
        open_count: 0,
        reply_count: 0,
        meetings_count: 0,
      });
      if (error) return toast.error(error.message);
      toast.success("Campaign created");
      invalidate();
    },
  };
}

/* ---------------- Create Campaign Dialog ---------------- */

function CreateCampaignDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [leads, setLeads] = useState(50);
  const [channels, setChannels] = useState<ChannelKey[]>(["email"]);
  const [launchNow, setLaunchNow] = useState(false);
  const [saving, setSaving] = useState(false);
  const actions = useCampaignActions();

  const toggle = (c: ChannelKey) =>
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const submit = async () => {
    if (!name.trim()) return toast.error("Campaign name required");
    if (channels.length === 0) return toast.error("Pick at least one channel");
    setSaving(true);
    await actions.create({
      name: name.trim(),
      channels,
      leads,
      status: launchNow ? "active" : "draft",
    });
    setSaving(false);
    setName("");
    setLeads(50);
    setChannels(["email"]);
    setLaunchNow(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
          <DialogDescription>
            Multi-channel outreach campaign for your workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Campaign name</Label>
            <Input
              placeholder="e.g. Gallabox India — WABA Launch Q2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Target audience size</Label>
            <Input
              type="number"
              min={1}
              value={leads}
              onChange={(e) => setLeads(Math.max(1, Number(e.target.value) || 0))}
            />
            <p className="text-xs text-muted-foreground">
              Number of leads to enroll from your CRM.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Channels</Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: "email", label: "Email", icon: Mail, tone: "text-indigo-500 bg-indigo-500/10" },
                  { key: "linkedin", label: "LinkedIn", icon: Linkedin, tone: "text-blue-500 bg-blue-500/10" },
                  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, tone: "text-emerald-500 bg-emerald-500/10" },
                ] as { key: ChannelKey; label: string; icon: React.ElementType; tone: string }[]
              ).map((c) => {
                const active = channels.includes(c.key);
                const Icon = c.icon;
                return (
                  <button
                    type="button"
                    key={c.key}
                    onClick={() => toggle(c.key)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2.5 text-xs transition",
                      active
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded", c.tone)}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="launch-now"
              checked={launchNow}
              onCheckedChange={(v) => setLaunchNow(Boolean(v))}
            />
            <Label htmlFor="launch-now" className="cursor-pointer text-sm font-normal">
              Launch immediately (otherwise save as Draft)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Creating…" : "Create Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Detail Drawer ---------------- */

function CampaignDetailSheet({
  campaign,
  onOpenChange,
}: {
  campaign: Campaign | null;
  onOpenChange: (v: boolean) => void;
}) {
  const actions = useCampaignActions();
  if (!campaign) return null;
  const StatusIcon = STATUS_ICON[campaign.status];
  const remaining = Math.max(0, campaign.leads - campaign.sent);
  const meetingsRate =
    campaign.sent > 0 ? ((campaign.meetings / campaign.sent) * 100).toFixed(1) : "0";

  return (
    <Sheet open={!!campaign} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="truncate text-base">{campaign.name}</SheetTitle>
              <SheetDescription>
                Created {relTimeShort(campaign.createdAt)} · Multi-channel campaign
              </SheetDescription>
            </div>
            <ChannelIcons channels={campaign.channels} />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-[10px] font-medium", STATUS_STYLES[campaign.status])}
            >
              <StatusIcon className="mr-1 h-3 w-3" />
              {campaign.status}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatBox icon={Users} label="Audience" value={campaign.leads.toLocaleString()} sub={`${remaining} remaining`} />
            <StatBox icon={Send} label="Sent" value={campaign.sent.toLocaleString()} sub={`${campaign.progress}% of audience`} />
            <StatBox icon={Eye} label="Opened" value={`${campaign.openedPct}%`} sub={`${campaign.openCount} opens`} />
            <StatBox icon={TrendingUp} label="Replied" value={`${campaign.repliedPct}%`} sub={`${campaign.replyCount} replies`} />
            <StatBox icon={Calendar} label="Meetings" value={String(campaign.meetings)} sub={`${meetingsRate}% booking rate`} />
            <StatBox icon={Target} label="Progress" value={`${campaign.progress}%`} sub={campaign.progress >= 100 ? "Complete" : "In flight"} />
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Funnel
            </p>
            <div className="space-y-3">
              <FunnelRow label="Enrolled" value={campaign.leads} max={campaign.leads} tone="bg-slate-400" />
              <FunnelRow label="Sent" value={campaign.sent} max={campaign.leads} tone="bg-indigo-500" />
              <FunnelRow label="Opened" value={campaign.openCount} max={campaign.leads} tone="bg-blue-500" />
              <FunnelRow label="Replied" value={campaign.replyCount} max={campaign.leads} tone="bg-emerald-500" />
              <FunnelRow label="Meetings booked" value={campaign.meetings} max={campaign.leads} tone="bg-amber-500" />
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Timeline
            </p>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>
                  <span className="font-medium text-foreground">Created</span> ·{" "}
                  {new Date(campaign.createdAt).toLocaleString()}
                </span>
              </li>
              {campaign.status !== "Draft" && (
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <span>
                    <span className="font-medium text-foreground">Launched</span> · {relTimeShort(campaign.createdAt)}
                  </span>
                </li>
              )}
              {campaign.status === "Paused" && (
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span className="font-medium text-foreground">Paused by user</span>
                </li>
              )}
            </ul>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            {campaign.status === "Active" && (
              <Button size="sm" variant="outline" onClick={() => actions.setStatus(campaign.id, "paused")}>
                <PauseCircle className="h-4 w-4" /> Pause
              </Button>
            )}
            {(campaign.status === "Paused" || campaign.status === "Draft") && (
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                onClick={() => actions.setStatus(campaign.id, "active")}
              >
                <PlayCircle className="h-4 w-4" />
                {campaign.status === "Draft" ? "Launch" : "Resume"}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => actions.duplicate(campaign)}>
              <Copy className="h-4 w-4" /> Duplicate
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function FunnelRow({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ---------------- Card ---------------- */

function CampaignCard({
  campaign,
  onView,
  onAction,
}: {
  campaign: Campaign;
  onView: () => void;
  onAction: (a: "pause" | "resume" | "launch" | "duplicate" | "delete") => void;
}) {
  const StatusIcon = STATUS_ICON[campaign.status];
  return (
    <Card className="group cursor-pointer transition-shadow hover:shadow-lg" onClick={onView}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">{campaign.name}</h3>
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn("text-[10px] font-medium", STATUS_STYLES[campaign.status])}
              >
                <StatusIcon className="mr-1 h-3 w-3" />
                {campaign.status}
              </Badge>
            </div>
          </div>
          <ChannelIcons channels={campaign.channels} />
        </div>

        {campaign.status !== "Draft" ? (
          <>
            <div className="mt-4 grid grid-cols-4 gap-2">
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{campaign.sent.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Sent</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{campaign.openedPct}%</p>
                <p className="text-[10px] text-muted-foreground">Opened</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{campaign.repliedPct}%</p>
                <p className="text-[10px] text-muted-foreground">Replied</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{campaign.meetings}</p>
                <p className="text-[10px] text-muted-foreground">Meetings</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{campaign.progress}%</span>
              </div>
              <Progress value={campaign.progress} className="h-1.5" />
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 py-6 text-center">
            <p className="text-xs text-muted-foreground">Draft — ready to configure</p>
          </div>
        )}

        <div
          className="mt-4 flex items-center justify-between border-t border-border pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {campaign.lastActivity}
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onView} title="View details">
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {campaign.status === "Active" && (
                  <DropdownMenuItem onClick={() => onAction("pause")}>
                    <PauseCircle className="h-4 w-4" /> Pause
                  </DropdownMenuItem>
                )}
                {campaign.status === "Paused" && (
                  <DropdownMenuItem onClick={() => onAction("resume")}>
                    <PlayCircle className="h-4 w-4" /> Resume
                  </DropdownMenuItem>
                )}
                {campaign.status === "Draft" && (
                  <DropdownMenuItem onClick={() => onAction("launch")}>
                    <PlayCircle className="h-4 w-4" /> Launch
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onAction("duplicate")}>
                  <Copy className="h-4 w-4" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onAction("delete")}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- Live Table ---------------- */

function LiveCampaignsTable({
  campaigns,
  onView,
}: {
  campaigns: Campaign[];
  onView: (c: Campaign) => void;
}) {
  const live = campaigns.filter((c) => c.status !== "Draft");
  if (live.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No live campaigns"
        description="Launch a campaign from All Campaigns to see it here."
      />
    );
  }
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Leads in Queue</TableHead>
            <TableHead className="text-right">Sent Today</TableHead>
            <TableHead>Next Action</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {live.map((c) => {
            const queue = Math.max(0, c.leads - c.sent);
            const sentToday = c.status === "Paused" ? 0 : Math.max(0, Math.round(c.sent * 0.06));
            const nextAction =
              c.status === "Paused"
                ? "Resume scheduled for Mon"
                : c.channels.includes("whatsapp")
                  ? "WhatsApp nudge in 8 min"
                  : "Follow-up batch in 12 min";
            return (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => onView(c)}>
                <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {c.status === "Active" ? (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      </span>
                    ) : (
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                    )}
                    <Badge variant="outline" className={cn("text-[10px] font-medium", STATUS_STYLES[c.status])}>
                      {c.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  {queue.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Send className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-foreground">{sentToday}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{nextAction}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => onView(c)}>
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

/* ---------------- Page ---------------- */

function CampaignStudioPage() {
  const { data: rows, isLoading } = useCampaigns();
  const actions = useCampaignActions();
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Campaign | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const campaigns: Campaign[] = useMemo(
    () =>
      (rows ?? []).map((r) => {
        const openedPct = r.sent_count > 0 ? Math.round((r.open_count / r.sent_count) * 100) : 0;
        const repliedPct = r.sent_count > 0 ? Math.round((r.reply_count / r.sent_count) * 100) : 0;
        const progress =
          r.leads_count > 0 ? Math.min(100, Math.round((r.sent_count / r.leads_count) * 100)) : 0;
        return {
          id: r.id,
          name: r.name,
          status: normalizeStatus(r.status),
          channels: (r.channels ?? []) as ChannelKey[],
          leads: r.leads_count ?? 0,
          sent: r.sent_count ?? 0,
          openCount: r.open_count ?? 0,
          replyCount: r.reply_count ?? 0,
          meetings: r.meetings_count ?? 0,
          openedPct,
          repliedPct,
          progress,
          lastActivity: relTimeShort(r.created_at),
          createdAt: r.created_at,
        };
      }),
    [rows],
  );

  const handleAction = (c: Campaign, a: "pause" | "resume" | "launch" | "duplicate" | "delete") => {
    if (a === "pause") return actions.setStatus(c.id, "paused");
    if (a === "resume" || a === "launch") return actions.setStatus(c.id, "active");
    if (a === "duplicate") return actions.duplicate(c);
    if (a === "delete") return setDeleteId(c.id);
  };

  return (
    <>
      <PageHeader
        eyebrow="Engagement"
        title="Campaign Studio"
        description="Build, launch and monitor multi-channel outreach campaigns."
        actions={
          <Button
            size="sm"
            className="bg-indigo-600 text-white hover:bg-indigo-600/90"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Campaign
          </Button>
        }
      />

      <Tabs defaultValue="all" className="mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="all" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            All Campaigns
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live Campaigns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <PageSkeleton variant="grid" />
          ) : campaigns.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No campaigns yet"
              description="Create your first campaign to reach your leads."
              action={
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" /> Create Campaign
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onView={() => setDetail(campaign)}
                  onAction={(a) => handleAction(campaign, a)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="live" className="mt-6">
          {isLoading ? (
            <PageSkeleton variant="table" />
          ) : (
            <LiveCampaignsTable campaigns={campaigns} onView={setDetail} />
          )}
        </TabsContent>
      </Tabs>

      <CreateCampaignDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CampaignDetailSheet
        campaign={detail}
        onOpenChange={(v) => !v && setDetail(null)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the campaign and its metrics. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteId) await actions.remove(deleteId);
                setDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
