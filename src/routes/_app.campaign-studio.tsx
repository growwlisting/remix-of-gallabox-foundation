import { createFileRoute } from "@tanstack/react-router";
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
  FileEdit,
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
import { getRouteMeta } from "@/lib/route-meta";
import { withLoading } from "@/components/states/page-skeleton";
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

type CampaignStatus = "Active" | "Draft" | "Paused";

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  channels: ("email" | "linkedin" | "whatsapp")[];
  sent: number;
  opened: number;
  replied: number;
  meetings: number;
  progress: number;
  lastActivity: string;
}

interface LiveCampaign {
  id: string;
  name: string;
  status: CampaignStatus;
  leadsInQueue: number;
  sentToday: number;
  nextAction: string;
}

const STATUS_STYLES: Record<CampaignStatus, string> = {
  Active:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  Draft:
    "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-transparent",
  Paused:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
};

const STATUS_ICON: Record<CampaignStatus, React.ElementType> = {
  Active: CheckCircle2,
  Draft: FileEdit,
  Paused: PauseCircle,
};

function ChannelIcons({ channels }: { channels: Campaign["channels"] }) {
  return (
    <div className="flex items-center gap-1.5">
      {channels.includes("email") && (
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10">
          <Mail className="h-3.5 w-3.5 text-indigo-500" />
        </div>
      )}
      {channels.includes("linkedin") && (
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10">
          <Linkedin className="h-3.5 w-3.5 text-blue-500" />
        </div>
      )}
      {channels.includes("whatsapp") && (
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10">
          <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
        </div>
      )}
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const StatusIcon = STATUS_ICON[campaign.status];
  return (
    <Card className="group transition-shadow hover:shadow-lg">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {campaign.name}
            </h3>
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

        {campaign.status !== "Draft" && (
          <>
            <div className="mt-4 grid grid-cols-4 gap-2">
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{campaign.sent.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Sent</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{campaign.opened}%</p>
                <p className="text-[10px] text-muted-foreground">Opened</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{campaign.replied}%</p>
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
        )}

        {campaign.status === "Draft" && (
          <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 py-6 text-center">
            <p className="text-xs text-muted-foreground">Draft — ready to configure</p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {campaign.lastActivity}
          </div>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LiveCampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
  const live = campaigns.filter((c) => c.status !== "Draft");
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
            const queue = Math.max(0, (c.sent > 0 ? Math.round(c.sent * 0.35) : 0));
            const sentToday = c.status === "Paused" ? 0 : Math.max(0, Math.round(c.sent * 0.06));
            const nextAction =
              c.status === "Paused"
                ? "Resume scheduled for Mon"
                : c.channels.includes("whatsapp")
                  ? "WhatsApp nudge in 8 min"
                  : "Follow-up batch in 12 min";
            return (
              <TableRow key={c.id}>
                <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {c.status === "Active" && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      </span>
                    )}
                    {c.status !== "Active" && (
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                    )}
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-medium", STATUS_STYLES[c.status])}
                    >
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
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover/row:opacity-100">
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
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

function CampaignStudioPage() {
  const { data: rows, isLoading } = useCampaigns();
  const campaigns: Campaign[] = (rows ?? []).map((r) => {
    const status = (["Active", "Draft", "Paused"].includes(r.status)
      ? r.status
      : "Draft") as CampaignStatus;
    const openedPct = r.sent_count > 0 ? Math.round((r.open_count / r.sent_count) * 100) : r.open_count;
    const repliedPct = r.sent_count > 0 ? Math.round((r.reply_count / r.sent_count) * 100) : r.reply_count;
    const progress = r.leads_count > 0 ? Math.min(100, Math.round((r.sent_count / r.leads_count) * 100)) : 0;
    return {
      id: r.id,
      name: r.name,
      status,
      channels: r.channels as Campaign["channels"],
      sent: r.sent_count,
      opened: openedPct,
      replied: repliedPct,
      meetings: r.meetings_count,
      progress,
      lastActivity: relTimeShort(r.created_at),
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Engagement"
        title="Campaign Studio"
        description="Build, launch and monitor multi-channel outreach campaigns."
        actions={
          <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-600/90">
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
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="live" className="mt-6">
          {isLoading ? <PageSkeleton variant="table" /> : <LiveCampaignsTable campaigns={campaigns} />}
        </TabsContent>
      </Tabs>
    </>
  );
}

