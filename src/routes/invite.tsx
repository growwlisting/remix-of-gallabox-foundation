import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AuthShell } from "./login";

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
    <AuthShell>
      <div className="space-y-6 text-center">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            You've been invited to join <span className="brand-text">{workspaceName}</span>
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">Accept to start collaborating with your team.</p>
        </div>
        <div className="flex items-center justify-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {inviterName.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-medium">{inviterName}</p>
            <p className="text-xs text-muted-foreground">Invited you as a teammate</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
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
      </div>
    </AuthShell>
  );
}
