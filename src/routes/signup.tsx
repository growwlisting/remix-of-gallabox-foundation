import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Rocket, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell, SidePanel } from "./login";

export const Route = createFileRoute("/signup")({
  ssr: false,
  component: SignupPage,
  head: () => ({ meta: [{ title: "Create account · Gallabox GrowthOS" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { full_name: fullName, company },
      },
    });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    if (data.session) {
      const { error: bErr } = await supabase.rpc("bootstrap_new_user", {
        _full_name: fullName,
        _company: company,
      });
      setLoading(false);
      if (bErr) return toast.error(bErr.message);
      toast.success("Welcome to GrowthOS");
      navigate({ to: "/dashboard", replace: true });
    } else {
      setLoading(false);
      toast.success("Check your email to confirm your account");
      navigate({ to: "/login", replace: true });
    }
  }

  return (
    <AuthShell
      side={
        <SidePanel
          eyebrow="Start free · 14 days"
          title={<>Deploy your <span className="brand-text">AI revenue team</span> in under 5 minutes.</>}
          subtitle="Join 500+ B2B teams replacing their SDR stack with one AI-native OS — no credit card required."
          stats={[
            { icon: Rocket, label: "Onboarding time", value: "< 5 min" },
            { icon: Users, label: "Teams already scaling", value: "500+" },
            { icon: ShieldCheck, label: "SOC 2 · GDPR ready", value: "Enterprise" },
          ]}
          footer={
            <blockquote className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm italic text-white/70">
              "We replaced Apollo, Outreach, and Clay with GrowthOS. One platform, 3x the pipeline."
              <footer className="mt-2 not-italic text-xs text-white/50">— Sarah Chen, VP Sales, Notion Labs</footer>
            </blockquote>
          }
        />
      }
      heading="Create your account"
      subheading="Spin up your workspace and meet your 15 AI agents."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company">Company</Label>
            <Input id="company" required value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="text-[11px] text-muted-foreground">Minimum 8 characters.</p>
        </div>
        <Button type="submit" disabled={loading} className="w-full brand-gradient text-brand-foreground">
          {loading ? "Creating account…" : "Create Account"}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          By signing up you agree to our Terms & Privacy Policy
        </p>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">Sign in →</Link>
      </p>
    </AuthShell>
  );
}
