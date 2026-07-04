import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  Check,
  FolderKanban,
  MoreHorizontal,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/states/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRouteMeta } from "@/lib/route-meta";
import { cn } from "@/lib/utils";
import { withLoading } from "@/components/states/page-skeleton";

const meta = getRouteMeta("/workspaces")!;

type Workspace = {
  id: string;
  name: string;
  slug: string;
  members: number;
  role: "Owner" | "Admin" | "Member";
  active: boolean;
  icon: LucideIcon;
  color: string;
};

// Workspaces are fetched live from the database — no mock list.

export const Route = createFileRoute("/_app/workspaces")({
  head: () => ({
    meta: [
      { title: `${meta.label} · Gallabox GrowthOS` },
      { name: "description", content: meta.description },
    ],
  }),
  component: withLoading(WorkspacesPage, "grid"),
});

function WorkspaceAvatar({ workspace }: { workspace: Workspace }) {
  const Icon = workspace.icon;
  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
        workspace.color,
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

function WorkspaceCard({
  workspace,
  onActivate,
}: {
  workspace: Workspace;
  onActivate: (id: string) => void;
}) {
  return (
    <Card
      className={cn(
        "transition-shadow hover:shadow-lg",
        workspace.active && "ring-1 ring-primary/20 shadow-md",
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <WorkspaceAvatar workspace={workspace} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{workspace.name}</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!workspace.active && (
                    <DropdownMenuItem onClick={() => onActivate(workspace.id)}>Switch to workspace</DropdownMenuItem>
                  )}
                  <DropdownMenuItem disabled>Settings</DropdownMenuItem>
                  <DropdownMenuItem disabled>Members</DropdownMenuItem>
                  <DropdownMenuItem disabled className="text-destructive focus:text-destructive">
                    Leave workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-xs text-muted-foreground">/{workspace.slug}</p>
            <div className="mt-3 flex items-center gap-2">
              {workspace.active && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium">
                  <Check className="mr-1 h-3 w-3" /> Active
                </Badge>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {workspace.members} members
              </div>
              <Badge variant="outline" className="h-5 text-[10px] font-medium">
                {workspace.role}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateWorkspaceDialog({ onCreate }: { onCreate: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Create workspace
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Add a new workspace to isolate teams, regions, or business units.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                placeholder="e.g. APAC Expansion"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700" disabled={!name.trim()}>
              Create workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WorkspacesPage() {
  const { data: profile } = useProfile();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["all-workspaces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("id, name, description, member_count")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const workspaces: Workspace[] = rows.map((w) => ({
    id: w.id,
    name: w.name,
    slug: w.name.toLowerCase().replace(/\s+/g, "-"),
    members: w.member_count ?? 1,
    role: "Owner",
    active: profile?.workspace_id === w.id,
    icon: Building2,
    color: "bg-indigo-500",
  }));

  const handleActivate = (_id: string) => {
    // Single-workspace mode for now — switching lives with a future auth-scoped update.
  };

  const handleCreate = async (name: string) => {
    // Create a fresh org + workspace pair in the same org group.
    const { data: org, error: oErr } = await supabase
      .from("organizations")
      .insert({ name, plan: "enterprise" })
      .select("id")
      .single();
    if (oErr || !org) return;
    await supabase
      .from("workspaces")
      .insert({ name, description: `${name} workspace`, org_id: org.id, member_count: 1 });
  };


  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title={meta.label}
        description={meta.description}
        actions={<CreateWorkspaceDialog onCreate={handleCreate} />}
      />

      {workspaces.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No workspaces yet"
          description="Create your first workspace to get started."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} onActivate={handleActivate} />
          ))}
        </div>
      )}

      <Card className="border-dashed bg-muted/40">
        <CardContent className="flex items-center gap-4 p-5">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-indigo-600 text-white text-xs font-semibold">HQ</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Need to invite a team?</p>
            <p className="text-xs text-muted-foreground">
              Members are managed per workspace. Invite colleagues from workspace settings once you switch in.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled>
            Invite members
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
