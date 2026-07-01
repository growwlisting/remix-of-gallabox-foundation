import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./login";

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
    // Ensure session (auto-confirm on) then bootstrap org/workspace/profile
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
    <AuthShell>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company">Company name</Label>
          <Input id="company" required value={company} onChange={(e) => setCompany(e.target.value)} />
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
