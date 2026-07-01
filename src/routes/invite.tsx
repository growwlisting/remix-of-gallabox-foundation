import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PartyPopper, Users, Layers } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AuthShell, SidePanel } from "./login";

export const Route = createFileRoute("/invite")({
  ssr: false,
  component: InvitePage,
  head: () => ({ meta: [{ title: "Accept invite · Gallabox GrowthOS" }] }),
});

function InvitePage() {
  const navigate = useNavigate();
  const workspaceName = "Acme Revenue";
  const inviterName = "Alex Rivera";

  return (
    <AuthShell
      side={
        <SidePanel
          eyebrow="You're invited"
          title={<>Join <span className="brand-text">{workspaceName}</span> on GrowthOS.</>}
          subtitle="Collaborate on pipeline, share AI agents, and run outreach together — all inside one revenue workspace."
          stats={[
            { icon: Users, label: "Teammates already active", value: "12" },
            { icon: Layers, label: "Shared workspaces", value: "3" },
            { icon: PartyPopper, label: "Free to accept", value: "$0" },
          ]}
        />
      }
      heading="Accept your invite"
      subheading="Review the details below and jump in."
    >
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {inviterName.split(" ").map((n) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{inviterName}</p>
          <p className="text-xs text-muted-foreground">Invited you to {workspaceName}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Button
          className="w-full brand-gradient text-brand-foreground"
          onClick={() => {
            toast.success(`Joined ${workspaceName}`);
            navigate({ to: "/dashboard", replace: true });
          }}
        >
          Accept invite
        </Button>
        <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/login" })}>
          Decline
        </Button>
      </div>
    </AuthShell>
  );
}
