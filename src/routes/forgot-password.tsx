import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Mail, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell, SidePanel } from "./login";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  component: ForgotPasswordPage,
  head: () => ({ meta: [{ title: "Reset password · Gallabox GrowthOS" }] }),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/login",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Reset link sent");
  }

  return (
    <AuthShell
      side={
        <SidePanel
          eyebrow="Account recovery"
          title={<>Back in your <span className="brand-text">revenue cockpit</span> in seconds.</>}
          subtitle="We'll email you a secure link so you can set a new password and jump straight back to your pipeline."
          stats={[
            { icon: Mail, label: "Delivered via secure link", value: "Email" },
            { icon: Clock, label: "Reset link valid for", value: "1 hour" },
            { icon: KeyRound, label: "Encrypted end-to-end", value: "AES-256" },
          ]}
        />
      }
      heading={sent ? "Check your inbox" : "Forgot your password?"}
      subheading={
        sent
          ? "We've emailed a reset link to your address. It expires in 1 hour."
          : "Enter your work email and we'll send you a reset link."
      }
    >
      {sent ? (
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            Didn't receive it? Check spam, or{" "}
            <button className="font-medium text-primary hover:underline" onClick={() => setSent(false)}>
              try a different email
            </button>
            .
          </div>
          <Button asChild className="w-full brand-gradient text-brand-foreground">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full brand-gradient text-brand-foreground">
            {loading ? "Sending link…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Remembered it?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">Sign in →</Link>
      </p>
    </AuthShell>
  );
}
