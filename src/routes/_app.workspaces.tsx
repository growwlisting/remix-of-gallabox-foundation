import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import {
  Building2,
  Check,
  FolderKanban,
  Mail,
  MoreHorizontal,
  Plus,
  UserPlus,
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
import { Textarea } from "@/components/ui/textarea";
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
  onLeave,
  otherWorkspaceCount,
}: {
  workspace: Workspace;
  onActivate: (id: string) => void;
  onLeave: (id: string) => void;
  otherWorkspaceCount: number;
}) {
  const [membersOpen, setMembersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const { data: members = [] } = useQuery({
    enabled: membersOpen,
    queryKey: ["ws-members", workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("workspace_id", workspace.id)
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: invites = [] } = useQuery({
    enabled: membersOpen,
    queryKey: ["ws-invites", workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_invites")
        .select("id, email, role, status")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <>
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
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setMembersOpen(true); }}>
                      Members
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>Settings</DropdownMenuItem>
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
                <button
                  type="button"
                  onClick={() => setMembersOpen(true)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Users className="h-3.5 w-3.5" />
                  {workspace.members} members
                </button>
                <Badge variant="outline" className="h-5 text-[10px] font-medium">
                  {workspace.role}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{workspace.name} members</DialogTitle>
            <DialogDescription>Active members and pending invites.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active ({members.length})
              </p>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active members yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {members.map((m) => (
                    <li key={m.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">
                            {(m.full_name ?? m.email ?? "?").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          <span className="font-medium">{m.full_name ?? "—"}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{m.email}</span>
                        </span>
                      </span>
                      <Badge variant="outline" className="text-[10px]">{m.role}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {invites.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pending invites ({invites.length})
                </p>
                <ul className="space-y-1.5">
                  {invites.map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {inv.email}
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{inv.role}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{inv.status}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
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

function InviteMembersDialog() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [submitting, setSubmitting] = useState(false);

  const { data: invites = [] } = useQuery({
    queryKey: ["workspace_invites", profile?.workspace_id],
    enabled: !!profile?.workspace_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_invites")
        .select("id, email, role, status, created_at")
        .eq("workspace_id", profile!.workspace_id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !profile?.workspace_id) return;
    setSubmitting(true);
    const { error } = await supabase.from("workspace_invites").insert({
      workspace_id: profile.workspace_id,
      email: email.trim().toLowerCase(),
      role,
      invited_by: profile.id,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error(`Invite failed: ${error.message}`);
      return;
    }
    toast.success(`Invite sent to ${email.trim()}`);
    setEmail("");
    queryClient.invalidateQueries({ queryKey: ["workspace_invites", profile.workspace_id] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4" />
          Invite members
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite teammates</DialogTitle>
          <DialogDescription>
            Send an invite to join this workspace. They will get access on first sign-in.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="teammate@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={submitting || !email.trim()}
            >
              {submitting ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </form>

        {invites.length > 0 && (
          <div className="mt-2 border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending invites
            </p>
            <ul className="space-y-1.5">
              {invites.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {inv.email}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{inv.role}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{inv.status}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function WorkspacesPage() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: rows = [] } = useQuery({
    queryKey: ["all-workspaces"],
    queryFn: async (): Promise<Array<{ id: string; name: string; actual_members: number }>> => {
      const { data: ws, error } = await supabase
        .from("workspaces")
        .select("id, name")
        .order("name");
      if (error) throw error;
      const { data: mems } = await supabase.from("profiles").select("workspace_id");
      const counts = new Map<string, number>();
      (mems ?? []).forEach((m) => {
        if (m.workspace_id) counts.set(m.workspace_id, (counts.get(m.workspace_id) ?? 0) + 1);
      });
      return (ws ?? []).map((w) => ({ ...w, actual_members: counts.get(w.id) ?? 0 }));
    },
  });

  const workspaces: Workspace[] = rows.map((w) => ({
    id: w.id,
    name: w.name,
    slug: w.name.toLowerCase().replace(/\s+/g, "-"),
    members: w.actual_members,
    role: "Owner",
    active: profile?.workspace_id === w.id,
    icon: Building2,
    color: "bg-indigo-500",
  }));

  const handleActivate = async (id: string) => {
    if (!profile?.id) return;
    const { error } = await supabase.from("profiles").update({ workspace_id: id }).eq("id", profile.id);
    if (error) {
      toast.error(`Could not switch: ${error.message}`);
      return;
    }
    toast.success("Switched workspace");
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["all-workspaces"] });
  };

  const handleCreate = async (name: string) => {
    const { data: org, error: oErr } = await supabase
      .from("organizations")
      .insert({ name, plan: "enterprise" })
      .select("id")
      .single();
    if (oErr || !org) {
      toast.error("Could not create workspace");
      return;
    }
    const { error: wErr } = await supabase
      .from("workspaces")
      .insert({ name, description: `${name} workspace`, org_id: org.id, member_count: 1 });
    if (wErr) {
      toast.error(`Workspace creation failed: ${wErr.message}`);
      return;
    }
    toast.success(`Workspace "${name}" created`);
    queryClient.invalidateQueries({ queryKey: ["all-workspaces"] });
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
              Add teammates by email. They'll join this workspace on sign-in.
            </p>
          </div>
          <InviteMembersDialog />
        </CardContent>
      </Card>
    </div>
  );
}
