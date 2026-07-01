import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Sparkles, BarChart3, Bot, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in · Gallabox GrowthOS" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard", replace: true });
  }

  async function onGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
  }

  return (
    <AuthShell
      side={
        <SidePanel
          eyebrow="Welcome back"
          title={<>Your AI revenue team is <span className="brand-text">already working.</span></>}
          subtitle="15 specialized agents have been researching accounts, scoring leads, and drafting outreach while you were away."
          stats={[
            { icon: BarChart3, label: "Pipeline generated overnight", value: "$284K" },
            { icon: Bot, label: "Agent actions since last login", value: "1,204" },
            { icon: Zap, label: "New buying signals detected", value: "37" },
          ]}
        />
      }
      heading="Sign in to GrowthOS"
      subheading="Enter your credentials to access your revenue OS."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
              Forgot?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading} className="w-full brand-gradient text-brand-foreground">
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <Divider />

      <Button type="button" variant="outline" className="w-full" onClick={onGoogle}>
        <GoogleIcon /> Continue with Google
      </Button>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/signup" className="font-medium text-primary hover:underline">Start free trial →</Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({
  children,
  side,
  heading,
  subheading,
}: {
  children: ReactNode;
  side: ReactNode;
  heading?: ReactNode;
  subheading?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between bg-[#0a0f1e] p-10 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 10%, rgba(99,102,241,0.28) 0%, transparent 60%), radial-gradient(50% 40% at 90% 90%, rgba(16,185,129,0.18) 0%, transparent 60%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative z-10 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl brand-gradient text-brand-foreground shadow-[var(--shadow-glow)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">Gallabox <span className="brand-text">GrowthOS</span></p>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/50">Revenue AI · v0.1</p>
          </div>
        </div>

        <div className="relative z-10">{side}</div>

        <p className="relative z-10 text-xs text-white/40">© 2026 Gallabox GrowthOS · All rights reserved</p>
      </aside>

      {/* Right form panel */}
      <main className="relative flex items-center justify-center bg-background px-4 py-10">
        <div className="absolute top-4 right-4 lg:top-6 lg:right-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to homepage
          </Link>
        </div>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-xl brand-gradient text-brand-foreground shadow-[var(--shadow-glow)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold tracking-tight">Gallabox <span className="brand-text">GrowthOS</span></p>
          </div>
          {(heading || subheading) && (
            <div className="mb-6">
              {heading && <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>}
              {subheading && <p className="mt-1.5 text-sm text-muted-foreground">{subheading}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

export function SidePanel({
  eyebrow,
  title,
  subtitle,
  stats,
  footer,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  stats?: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[];
  footer?: ReactNode;
}) {
  return (
    <div className="max-w-md space-y-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/70">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        {eyebrow}
      </div>
      <h2 className="text-3xl font-bold leading-tight tracking-tight xl:text-4xl">{title}</h2>
      <p className="text-sm leading-relaxed text-white/60">{subtitle}</p>

      {stats && (
        <div className="grid gap-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                <s.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white/50">{s.label}</p>
              </div>
              <p className="text-sm font-semibold text-white">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {footer}
    </div>
  );
}

export function Divider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">or</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.5-1.7 4.4-5.5 4.4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.6C16.9 3.7 14.7 2.7 12 2.7 6.9 2.7 2.8 6.8 2.8 12s4.1 9.3 9.2 9.3c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
