import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  Linkedin,
  MessageCircle,
  Slack,
  Workflow,
  Cloud,
  Database,
  Rocket,
  Sparkles,
  ImageIcon,
  Upload,
  Loader2,
  UserPlus,
  Trash2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/states/page-header";
import { withLoading } from "@/components/states/page-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/settings")({
  component: withLoading(SettingsPage, "default"),
});

type WorkspaceSettings = {
  industry?: string;
  company_size?: string;
  timezone?: string;
  brand_color?: string;
  tone?: string;
  ai?: {
    model?: string;
    tone?: string;
    max_length?: number;
    memory?: boolean;
    rules?: string;
  };
  integrations?: Record<string, { connected: boolean; connected_at?: string }>;
  notifications?: {
    email_new_lead?: boolean;
    email_reply_received?: boolean;
    email_deal_stage?: boolean;
    email_weekly_digest?: boolean;
    slack_alerts?: boolean;
    inapp_mentions?: boolean;
  };
};

function useWorkspace() {
  const { data: profile } = useProfile();
  const wsId = profile?.workspace_id ?? null;
  const q = useQuery({
    enabled: !!wsId,
    queryKey: ["workspace", wsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("id, name, description, sender_name, sender_email, settings, org_id, member_count")
        .eq("id", wsId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  return { workspace: q.data, isLoading: q.isLoading, workspaceId: wsId };
}

function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Configure your GrowthOS workspace." />

      <Tabs defaultValue="general" className="flex flex-col gap-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="ai">AI Configuration</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0"><GeneralTab /></TabsContent>
        <TabsContent value="team" className="mt-0"><TeamTab /></TabsContent>
        <TabsContent value="integrations" className="mt-0"><IntegrationsTab /></TabsContent>
        <TabsContent value="ai" className="mt-0"><AIConfigTab /></TabsContent>
        <TabsContent value="billing" className="mt-0"><BillingTab /></TabsContent>
        <TabsContent value="notifications" className="mt-0"><NotificationsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- General ---------------- */

function GeneralTab() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const { workspace, workspaceId } = useWorkspace();
  const s = (workspace?.settings ?? {}) as WorkspaceSettings;

  const [wsName, setWsName] = useState("");
  const [wsDesc, setWsDesc] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [industry, setIndustry] = useState("saas");
  const [size, setSize] = useState("51-200");
  const [timezone, setTimezone] = useState("ist");
  const [brandColor, setBrandColor] = useState("#6366F1");
  const [tone, setTone] = useState("professional");
  const [inited, setInited] = useState(false);

  useEffect(() => {
    if (!workspace || inited) return;
    setWsName(workspace.name ?? "");
    setWsDesc(workspace.description ?? "");
    setSenderName(workspace.sender_name ?? "");
    setSenderEmail(workspace.sender_email ?? "");
    setIndustry(s.industry ?? "saas");
    setSize(s.company_size ?? "51-200");
    setTimezone(s.timezone ?? "ist");
    setBrandColor(s.brand_color ?? "#6366F1");
    setTone(s.tone ?? "professional");
    setInited(true);
  }, [workspace, inited, s]);

  const saveWorkspace = useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error("No workspace");
      const next: WorkspaceSettings = {
        ...s,
        industry, company_size: size, timezone, brand_color: brandColor, tone,
      };
      const { error } = await supabase
        .from("workspaces")
        .update({
          name: wsName.trim() || "Workspace",
          description: wsDesc.trim() || null,
          sender_name: senderName.trim() || null,
          sender_email: senderEmail.trim() || null,
          settings: next as never,
        })
        .eq("id", workspaceId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Workspace saved");
      qc.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      qc.invalidateQueries({ queryKey: ["workspaces"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* Profile card */
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [pInited, setPInited] = useState(false);
  useEffect(() => {
    if (!profile || pInited) return;
    setFullName(profile.full_name ?? "");
    setCompany(profile.company ?? "");
    setPInited(true);
  }, [profile, pInited]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() || null, company: company.trim() || null })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Basic information about your organization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input id="workspace-name" value={wsName} onChange={(e) => setWsName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workspace-desc">Description</Label>
            <Textarea id="workspace-desc" rows={2} value={wsDesc} onChange={(e) => setWsDesc(e.target.value)} placeholder="What this workspace is for" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sender-name">Sender Name</Label>
              <Input id="sender-name" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sender-email">Sender Email</Label>
              <Input id="sender-email" type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="jane@acme.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="saas">B2B SaaS</SelectItem>
                <SelectItem value="fintech">Fintech</SelectItem>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="services">Professional Services</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Company Size</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1-10 employees</SelectItem>
                <SelectItem value="11-50">11-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="201-500">201-500 employees</SelectItem>
                <SelectItem value="500+">500+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ist">IST - India Standard Time</SelectItem>
                <SelectItem value="pst">PST - Pacific Standard Time</SelectItem>
                <SelectItem value="est">EST - Eastern Standard Time</SelectItem>
                <SelectItem value="gmt">GMT - Greenwich Mean Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={!workspaceId || saveWorkspace.isPending}
            onClick={() => saveWorkspace.mutate()}
          >
            {saveWorkspace.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>How you appear across the workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email ?? ""} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={profile?.role ?? ""} readOnly disabled />
            </div>
            <Button
              variant="outline"
              disabled={!profile || saveProfile.isPending}
              onClick={() => saveProfile.mutate()}
            >
              {saveProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand & Voice</CardTitle>
            <CardDescription>How GrowthOS speaks and looks for your team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="brand-color">Primary Color</Label>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg border border-border" style={{ backgroundColor: brandColor }} />
                <Input
                  id="brand-color"
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-10 w-16 cursor-pointer p-1"
                />
                <code className="rounded-md bg-muted px-2 py-1 text-xs">{brandColor}</code>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tone of Voice</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="playful">Playful</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <label className="flex cursor-not-allowed flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center opacity-70">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Logo upload</p>
                <p className="text-xs text-muted-foreground">Coming soon — will use workspace storage</p>
                <Button variant="outline" size="sm" className="mt-1" disabled>
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  Choose file
                </Button>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Brand color & tone are saved with workspace settings above.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Team ---------------- */

function TeamTab() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const wsId = profile?.workspace_id ?? null;

  const membersQ = useQuery({
    enabled: !!wsId,
    queryKey: ["ws-members", wsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, avatar_url, created_at")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const invitesQ = useQuery({
    enabled: !!wsId,
    queryKey: ["ws-invites", wsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_invites")
        .select("id, email, role, status, created_at")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const invite = useMutation({
    mutationFn: async () => {
      if (!wsId || !profile) throw new Error("No workspace");
      const { error } = await supabase.from("workspace_invites").insert({
        workspace_id: wsId, email: email.trim().toLowerCase(), role, invited_by: profile.id, status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Invite sent to ${email}`);
      setEmail(""); setInviteOpen(false);
      qc.invalidateQueries({ queryKey: ["ws-invites", wsId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workspace_invites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invite revoked");
      qc.invalidateQueries({ queryKey: ["ws-invites", wsId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["ws-members", wsId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const members = membersQ.data ?? [];
  const invites = invitesQ.data ?? [];
  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Team members</CardTitle>
            <CardDescription>{members.length} member{members.length === 1 ? "" : "s"} in this workspace</CardDescription>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
                <UserPlus className="mr-2 h-4 w-4" /> Invite member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite teammate</DialogTitle>
                <DialogDescription>They will join on first sign-in with this email.</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => { e.preventDefault(); if (email.trim()) invite.mutate(); }}
                className="grid gap-4 py-2"
              >
                <div className="grid gap-2">
                  <Label htmlFor="inv-email">Email</Label>
                  <Input id="inv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" />
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={invite.isPending || !email.trim()} className="bg-indigo-600 text-white hover:bg-indigo-700">
                    {invite.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send invite
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {membersQ.isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
          ) : members.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No members yet.
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {members.map((m) => {
                const name = m.full_name || m.email?.split("@")[0] || "Member";
                const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                const isYou = m.id === profile?.id;
                return (
                  <div key={m.id} className="flex items-center gap-3 p-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {name} {isYou && <span className="text-xs text-muted-foreground">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    {isAdmin && !isYou ? (
                      <Select value={m.role} onValueChange={(v) => changeRole.mutate({ id: m.id, role: v })}>
                        <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="capitalize">{m.role}</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending invites</CardTitle>
          <CardDescription>Invites that haven't been accepted yet.</CardDescription>
        </CardHeader>
        <CardContent>
          {invitesQ.isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
          ) : invites.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No pending invites.
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {inv.role} · {inv.status} · invited {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => revokeInvite.mutate(inv.id)}
                    disabled={revokeInvite.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Integrations ---------------- */

const INTEGRATIONS = [
  { name: "Gmail", category: "Email", icon: Mail, color: "bg-red-500/10 text-red-600" },
  { name: "LinkedIn", category: "Social", icon: Linkedin, color: "bg-blue-500/10 text-blue-600" },
  { name: "WhatsApp (Gallabox)", category: "Messaging", icon: MessageCircle, color: "bg-emerald-500/10 text-emerald-600" },
  { name: "Slack", category: "Communication", icon: Slack, color: "bg-violet-500/10 text-violet-600" },
  { name: "n8n", category: "Automation", icon: Workflow, color: "bg-rose-500/10 text-rose-600" },
  { name: "Salesforce", category: "CRM", icon: Cloud, color: "bg-sky-500/10 text-sky-600" },
  { name: "HubSpot", category: "CRM", icon: Rocket, color: "bg-orange-500/10 text-orange-600" },
  { name: "Apollo", category: "Data", icon: Sparkles, color: "bg-indigo-500/10 text-indigo-600" },
  { name: "Clay", category: "Data", icon: Database, color: "bg-amber-500/10 text-amber-600" },
];

function IntegrationsTab() {
  const qc = useQueryClient();
  const { workspace, workspaceId } = useWorkspace();
  const settings = (workspace?.settings ?? {}) as WorkspaceSettings;
  const connected = settings.integrations ?? {};

  const toggle = useMutation({
    mutationFn: async ({ name, next }: { name: string; next: boolean }) => {
      if (!workspaceId) throw new Error("No workspace");
      const nextIntegrations = {
        ...connected,
        [name]: { connected: next, connected_at: next ? new Date().toISOString() : undefined },
      };
      const { error } = await supabase
        .from("workspaces")
        .update({ settings: { ...settings, integrations: nextIntegrations } as never })
        .eq("id", workspaceId);
      if (error) throw error;
      return { name, next };
    },
    onSuccess: ({ name, next }) => {
      toast.success(`${name} ${next ? "connected" : "disconnected"}`);
      qc.invalidateQueries({ queryKey: ["workspace", workspaceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>Tools plugged into your revenue workflows. Connection state is saved per workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS.map((int) => {
            const Icon = int.icon;
            const isConnected = !!connected[int.name]?.connected;
            return (
              <div
                key={int.name}
                className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-indigo-500/40 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", int.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{int.name}</p>
                    <p className="text-xs text-muted-foreground">{int.category}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      isConnected
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {isConnected ? "Connected" : "Not Connected"}
                  </Badge>
                  {isConnected ? (
                    <Button variant="outline" size="sm" disabled={toggle.isPending}
                      onClick={() => toggle.mutate({ name: int.name, next: false })}>
                      Disconnect
                    </Button>
                  ) : (
                    <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700" disabled={toggle.isPending}
                      onClick={() => toggle.mutate({ name: int.name, next: true })}>
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- AI ---------------- */

function AIConfigTab() {
  const qc = useQueryClient();
  const { workspace, workspaceId } = useWorkspace();
  const settings = (workspace?.settings ?? {}) as WorkspaceSettings;
  const ai = settings.ai ?? {};

  const [model, setModel] = useState("gpt-4o");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState([50]);
  const [memory, setMemory] = useState(true);
  const [rules, setRules] = useState("");
  const [inited, setInited] = useState(false);

  useEffect(() => {
    if (!workspace || inited) return;
    setModel(ai.model ?? "gpt-4o");
    setTone(ai.tone ?? "professional");
    setLength([ai.max_length ?? 50]);
    setMemory(ai.memory ?? true);
    setRules(ai.rules ?? `1. Always personalize with a specific buying signal
2. Keep first-touch emails under 100 words
3. Never mention competitors by name
4. Follow the 2-DM max rule on LinkedIn`);
    setInited(true);
  }, [workspace, inited, ai]);

  const save = useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error("No workspace");
      const next: WorkspaceSettings = {
        ...settings,
        ai: { model, tone, max_length: length[0], memory, rules },
      };
      const { error } = await supabase.from("workspaces").update({ settings: next as never }).eq("id", workspaceId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("AI configuration saved");
      qc.invalidateQueries({ queryKey: ["workspace", workspaceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>AI Configuration</CardTitle>
        <CardDescription>Tune how your agents think, write, and remember. Applies to all agents in this workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Default AI Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="claude">Claude 3.5 Sonnet</SelectItem>
              <SelectItem value="gemini">Gemini Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Response Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
              <SelectItem value="concise">Concise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Max Response Length</Label>
            <span className="text-xs font-medium text-muted-foreground">
              {length[0] < 33 ? "Short" : length[0] < 66 ? "Medium" : "Long"}
            </span>
          </div>
          <Slider value={length} onValueChange={setLength} max={100} step={1} />
        </div>
        <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
          <div>
            <Label className="text-sm">AI Memory</Label>
            <p className="mt-1 text-xs text-muted-foreground">Allow AI to remember context across sessions.</p>
          </div>
          <Switch checked={memory} onCheckedChange={setMemory} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ai-rules">AI Rules</Label>
          <Textarea id="ai-rules" rows={5} value={rules} onChange={(e) => setRules(e.target.value)} />
        </div>
        <Button className="bg-indigo-600 text-white hover:bg-indigo-700"
          disabled={!workspaceId || save.isPending} onClick={() => save.mutate()}>
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save AI Config
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------------- Notifications ---------------- */

const NOTIFICATION_ITEMS: { key: keyof NonNullable<WorkspaceSettings["notifications"]>; title: string; desc: string }[] = [
  { key: "email_new_lead", title: "New hot lead", desc: "Email me when a lead becomes hot." },
  { key: "email_reply_received", title: "Reply received", desc: "Email when a prospect replies to outreach." },
  { key: "email_deal_stage", title: "Deal stage changes", desc: "Email when a deal moves stage." },
  { key: "email_weekly_digest", title: "Weekly digest", desc: "Every Monday, a summary of pipeline & signals." },
  { key: "slack_alerts", title: "Slack alerts", desc: "Push critical alerts to your connected Slack." },
  { key: "inapp_mentions", title: "In-app @mentions", desc: "Notify when a teammate @mentions you." },
];

function NotificationsTab() {
  const qc = useQueryClient();
  const { workspace, workspaceId } = useWorkspace();
  const settings = (workspace?.settings ?? {}) as WorkspaceSettings;

  const defaults = useMemo(
    () => ({
      email_new_lead: true, email_reply_received: true, email_deal_stage: true,
      email_weekly_digest: true, slack_alerts: false, inapp_mentions: true,
      ...(settings.notifications ?? {}),
    }),
    [settings.notifications],
  );

  const [state, setState] = useState(defaults);
  const [inited, setInited] = useState(false);
  useEffect(() => {
    if (!workspace || inited) return;
    setState(defaults);
    setInited(true);
  }, [workspace, inited, defaults]);

  const save = useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error("No workspace");
      const next: WorkspaceSettings = { ...settings, notifications: state };
      const { error } = await supabase.from("workspaces").update({ settings: next as never }).eq("id", workspaceId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notifications saved");
      qc.invalidateQueries({ queryKey: ["workspace", workspaceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose how and when GrowthOS alerts you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {NOTIFICATION_ITEMS.map((n) => (
          <div key={n.key} className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.desc}</p>
            </div>
            <Switch
              checked={!!state[n.key]}
              onCheckedChange={(v) => setState((s) => ({ ...s, [n.key]: v }))}
            />
          </div>
        ))}
        <Button className="bg-indigo-600 text-white hover:bg-indigo-700"
          disabled={!workspaceId || save.isPending} onClick={() => save.mutate()}>
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Notifications
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------------- Billing ---------------- */

function BillingTab() {
  const { workspace } = useWorkspace();
  const orgId = workspace?.org_id ?? null;
  const orgQ = useQuery({
    enabled: !!orgId,
    queryKey: ["org", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, plan, created_at")
        .eq("id", orgId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const org = orgQ.data;
  const plan = org?.plan ?? "free";

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>Plan, seats, and invoices for your organization.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">Organization</p>
            <p className="mt-1 truncate text-sm font-semibold">{org?.name ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">Current plan</p>
            <p className="mt-1 text-sm font-semibold capitalize">{plan}</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">Seats used</p>
            <p className="mt-1 text-sm font-semibold">{workspace?.member_count ?? 0}</p>
          </div>
        </div>
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Upgrade & invoice history coming soon. Contact sales to change plan.
        </div>
      </CardContent>
    </Card>
  );
}
