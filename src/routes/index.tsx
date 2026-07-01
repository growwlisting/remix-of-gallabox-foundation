import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Brain,
  Globe,
  Users,
  Send,
  Megaphone,
  Zap,
  TrendingUp,
  BarChart2,
  BookOpen,
  Layers,
  Target,
  Play,
  ArrowRight,
  Menu,
  X,
  Check,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  ssr: false,
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Gallabox GrowthOS — AI Revenue Operating System for B2B Sales Teams" },
      {
        name: "description",
        content:
          "GrowthOS unifies AI research, ICP creation, prospecting, outreach, CRM and analytics into one revenue OS. Close more deals with 15 specialized AI agents.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Gallabox GrowthOS — AI Revenue Operating System" },
      {
        property: "og:description",
        content:
          "One OS. 15 AI agents. Replace your SDR stack with an AI workforce that researches, prospects and closes.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Gallabox GrowthOS",
          applicationCategory: "BusinessApplication",
          description:
            "AI-native Revenue Operating System that unifies research, prospecting, outreach, CRM and analytics with 15 specialized AI agents.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          operatingSystem: "Web",
        }),
      },
    ],
  }),
});

const ANIM_CSS = `
.gos-reveal { opacity: 0; transform: translateY(20px); transition: opacity .6s ease, transform .6s ease; }
.gos-reveal.visible { opacity: 1; transform: translateY(0); }

@keyframes gos-pulse-dot { 0%,100% { opacity: .4 } 50% { opacity: 1 } }
.gos-pulse-dot { animation: gos-pulse-dot 2s ease-in-out infinite; }

@keyframes gos-float { 0%,100% { transform: translateY(-6px) } 50% { transform: translateY(6px) } }
.gos-float { animation: gos-float 4s ease-in-out infinite; }

.gos-grid-bg {
  background-image:
    repeating-linear-gradient(0deg, color-mix(in oklch, var(--foreground) 4%, transparent) 0 1px, transparent 1px 40px),
    repeating-linear-gradient(90deg, color-mix(in oklch, var(--foreground) 4%, transparent) 0 1px, transparent 1px 40px);
}
.gos-hero-bg {
  background:
    radial-gradient(ellipse at 50% 20%, color-mix(in oklch, var(--brand) 12%, transparent) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 60%, color-mix(in oklch, var(--brand-end) 10%, transparent) 0%, transparent 55%);
}
.gos-hide-scrollbar::-webkit-scrollbar { display: none; }
.gos-hide-scrollbar { scrollbar-width: none; }

.gos-feature { transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
.gos-feature:hover {
  border-left-color: var(--brand);
  transform: translateY(-3px);
  box-shadow: var(--shadow-elevated);
}

@media (prefers-reduced-motion: reduce) {
  .gos-pulse-dot, .gos-float { animation: none !important; }
  .gos-reveal { opacity: 1; transform: none; transition: none; }
  .gos-feature { transition: none; }
}
`;

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#agents", label: "Agents" },
  { href: "#pricing", label: "Pricing" },
];

const FEATURES = [
  { icon: LayoutDashboard, name: "Dashboard", desc: "Pipeline overview and AI mission control" },
  { icon: Brain, name: "AI Command Center", desc: "Orchestrate 15 AI agents from one hub" },
  { icon: Globe, name: "Market Intelligence", desc: "Live buying signals and competitor intel" },
  { icon: Users, name: "Lead Intelligence", desc: "AI-scored leads with enriched signals" },
  { icon: Send, name: "Outreach Studio", desc: "Email, LinkedIn, WhatsApp, video sequences" },
  { icon: Megaphone, name: "Campaign Studio", desc: "Multi-channel campaigns on autopilot" },
  { icon: Zap, name: "Automation Studio", desc: "No-code AI workflows that run 24/7" },
  { icon: TrendingUp, name: "CRM", desc: "AI-enriched pipeline with deal intelligence" },
  { icon: BarChart2, name: "Analytics", desc: "Revenue intelligence across every channel" },
  { icon: BookOpen, name: "Knowledge Hub", desc: "Your AI's memory — prompts and playbooks" },
  { icon: Layers, name: "Workspaces", desc: "Separate environments for every team" },
];

const AGENT_CATEGORIES = {
  strategy: { className: "bg-chart-1", label: "Strategy" },
  research: { className: "bg-chart-2", label: "Research" },
  scoring: { className: "bg-warning", label: "Scoring" },
  outreach: { className: "bg-success", label: "Outreach" },
  execution: { className: "bg-chart-5", label: "Execution" },
  intelligence: { className: "bg-chart-3", label: "Intelligence" },
} as const;

const AGENTS: { name: string; emoji: string; cat: keyof typeof AGENT_CATEGORIES }[] = [
  { name: "Sales Strategist", emoji: "🎯", cat: "strategy" },
  { name: "ICP Builder", emoji: "🧭", cat: "strategy" },
  { name: "Persona Builder", emoji: "👤", cat: "strategy" },
  { name: "Company Research", emoji: "🏢", cat: "research" },
  { name: "Website Analyzer", emoji: "🔍", cat: "research" },
  { name: "Buying Signals", emoji: "📡", cat: "research" },
  { name: "Lead Scoring", emoji: "⭐", cat: "scoring" },
  { name: "Memory Manager", emoji: "🧠", cat: "scoring" },
  { name: "Outreach Writer", emoji: "✍️", cat: "outreach" },
  { name: "WhatsApp Agent", emoji: "💬", cat: "outreach" },
  { name: "LinkedIn Agent", emoji: "in", cat: "outreach" },
  { name: "Campaign Builder", emoji: "📣", cat: "execution" },
  { name: "Workflow Builder", emoji: "⚙️", cat: "execution" },
  { name: "Analytics Agent", emoji: "📊", cat: "intelligence" },
  { name: "Meeting Coach", emoji: "🎓", cat: "intelligence" },
];

const eyebrow = "font-mono text-[11px] uppercase tracking-widest";

function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll(".gos-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  const goApp = () => navigate({ to: "/dashboard" });
  const goSignup = () => navigate({ to: "/signup" });
  const goLogin = () => navigate({ to: "/login" });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />

      {/* NAV */}
      <nav
        aria-label="Primary"
        className={cn(
          "fixed inset-x-0 top-0 z-50 backdrop-blur-md transition-colors",
          scrolled
            ? "border-b border-border bg-background/85"
            : "border-b border-transparent bg-background/60",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="brand-gradient grid h-8 w-8 place-items-center rounded-lg">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              Gallabox <span className="brand-text">GrowthOS</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            {authed ? (
              <button
                onClick={goApp}
                className="brand-gradient rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02]"
              >
                Go to app →
              </button>
            ) : (
              <>
                <button
                  onClick={goLogin}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </button>
                <button
                  onClick={goSignup}
                  className="brand-gradient rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02]"
                >
                  Start Free Trial
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              className="text-foreground p-2"
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background px-5 py-4">
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2 flex gap-2">
                {authed ? (
                  <button
                    onClick={goApp}
                    className="brand-gradient flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    Go to app
                  </button>
                ) : (
                  <>
                    <button
                      onClick={goLogin}
                      className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-foreground"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={goSignup}
                      className="brand-gradient flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                      Start Trial
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <main>
        {/* HERO */}
        <section
          id="hero"
          aria-label="Hero"
          className="gos-hero-bg relative overflow-hidden pt-32 pb-20"
        >
          <div className="gos-grid-bg absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-5 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3.5 py-1.5">
              <span className="gos-pulse-dot h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_var(--success)]" />
              <span className={cn(eyebrow, "text-success")}>LIVE · 15 AI AGENTS RUNNING</span>
            </div>

            <h1 className="mx-auto mt-6 max-w-4xl text-[40px] font-bold leading-[1.05] tracking-tight text-foreground md:text-[64px]">
              Your AI Workforce for
              <br />
              <span className="brand-text">Revenue Generation.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-[620px] text-lg leading-relaxed text-muted-foreground md:text-xl">
              GrowthOS replaces your SDR stack with 15 specialized AI agents that research,
              prospect, write outreach, run campaigns, and close deals — all in one OS.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={goSignup}
                className="brand-gradient ai-glow inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-base font-medium text-foreground hover:bg-accent">
                <Play className="h-4 w-4" /> Watch Demo
              </button>
            </div>

            <p className={cn(eyebrow, "mt-5 text-muted-foreground")}>
              Trusted by 500+ B2B revenue teams · No credit card required
            </p>

            {/* Hero Mockup */}
            <div className="gos-float relative mx-auto mt-14 max-w-4xl">
              <div className="ai-glow relative rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-elevated)]">
                {/* top bar */}
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success" />
                  <span className={cn(eyebrow, "ml-3 text-muted-foreground normal-case tracking-normal")}>
                    GrowthOS · Dashboard
                  </span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_180px]">
                  <div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      {[
                        { l: "Pipeline", v: "$2.4M" },
                        { l: "Leads", v: "1,284" },
                        { l: "Meetings", v: "47" },
                        { l: "Revenue", v: "$340K" },
                      ].map((k) => (
                        <div
                          key={k.l}
                          className="rounded-lg border border-border bg-surface p-2.5 text-left"
                        >
                          <div className={cn(eyebrow, "text-muted-foreground")}>{k.l}</div>
                          <div className="mt-0.5 text-base font-semibold tracking-tight text-foreground">
                            {k.v}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-lg border border-border bg-surface p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-[11px] text-muted-foreground">Pipeline by stage</div>
                        <div className={cn(eyebrow, "text-muted-foreground")}>Q1 2026</div>
                      </div>
                      <div className="flex items-end gap-2" style={{ height: 90 }}>
                        {[45, 70, 55, 90, 62].map((h, i) => (
                          <div
                            key={i}
                            className="brand-gradient flex-1 rounded-t"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-surface p-3 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="gos-pulse-dot h-1.5 w-1.5 rounded-full bg-success" />
                      <div className="text-[11px] font-medium text-foreground">AI Copilot</div>
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">Today's Mission</div>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="brand-gradient h-full rounded-full" style={{ width: "68%" }} />
                    </div>
                    <div className={cn(eyebrow, "mt-1 text-muted-foreground")}>68% complete</div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-3 -top-3 rounded-full border border-success/40 bg-success/15 px-3 py-1.5 text-xs font-semibold text-success shadow-lg md:-right-6 md:-top-4">
                ↑ 23% meetings this week
              </div>
            </div>
          </div>
        </section>

        {/* LOGOS */}
        <section id="logos" aria-label="Trusted by" className="border-y border-border bg-surface py-14">
          <div className="mx-auto max-w-6xl px-5 text-center">
            <p className={cn(eyebrow, "text-muted-foreground")}>Trusted by revenue teams at</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {["Notion", "Linear", "Vercel", "Figma", "Stripe", "Airtable"].map((n) => (
                <span
                  key={n}
                  className="text-lg font-semibold tracking-tight text-muted-foreground/70 transition-colors hover:text-foreground"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* PROBLEM / SOLUTION */}
        <section id="problem" aria-label="Problem and solution" className="py-24">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-2">
            <div className="gos-reveal rounded-2xl border border-destructive/25 bg-card p-8">
              <h2 className="text-2xl font-bold tracking-tight text-destructive">
                Your stack is broken.
              </h2>
              <ul className="mt-6 space-y-3">
                {[
                  "6+ disconnected tools (Apollo, Outreach, HubSpot, Clay, Lemlist…)",
                  "SDRs spend 70% of time on manual research",
                  "No context between research, outreach, and CRM",
                  "AI tools that don't talk to each other",
                  "$15,000+/month in stack costs",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-foreground">
                    <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="gos-reveal rounded-2xl border border-success/25 bg-card p-8">
              <h2 className="text-2xl font-bold tracking-tight text-success">
                One OS. 15 AI Agents.
              </h2>
              <ul className="mt-6 space-y-3">
                {[
                  "Research, outreach, CRM and analytics unified",
                  "AI agents work 24/7 without manual input",
                  "Full context flows from signal → outreach → deal",
                  "Agents collaborate: ICP Builder feeds Outreach Writer",
                  "One platform, fraction of the cost",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" aria-label="Features" className="bg-surface py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="gos-reveal text-center">
              <p className={cn(eyebrow, "brand-text")}>Platform</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Everything your revenue team needs.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
                11 intelligent modules, each powered by AI agents that actually work together.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.name}
                  className="gos-reveal gos-feature rounded-xl border border-l-2 border-border bg-card p-5"
                >
                  <f.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 text-base font-semibold tracking-tight text-foreground">
                    {f.name}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AGENTS */}
        <section id="agents" aria-label="AI agents" className="bg-surface py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="gos-reveal text-center">
              <p className={cn(eyebrow, "text-success")}>AI Agents</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                15 AI agents. One revenue team.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
                Each agent is a specialist. Together they're unstoppable.
              </p>
            </div>

            <div className="gos-hide-scrollbar mt-12 flex gap-3 overflow-x-auto pb-2">
              {AGENTS.map((a) => (
                <div
                  key={a.name}
                  className="flex w-[130px] flex-shrink-0 flex-col items-start rounded-xl border border-border bg-card p-3"
                >
                  <div className="text-2xl">{a.emoji}</div>
                  <div className="mt-3 text-[13px] font-semibold text-foreground">{a.name}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", AGENT_CATEGORIES[a.cat].className)} />
                    <span className={cn(eyebrow, "text-muted-foreground")}>
                      {AGENT_CATEGORIES[a.cat].label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="gos-reveal mt-10 text-center text-sm text-muted-foreground">
              All agents share context → your ICP feeds your Outreach Writer which feeds your
              Campaign Builder.
            </p>

            <div className="gos-reveal mt-6 flex flex-wrap items-center justify-center gap-2">
              {["ICP Builder", "Lead Scoring", "Outreach Writer", "Campaign Builder", "Analytics Agent"].map(
                (n, i, arr) => (
                  <div key={n} className="flex items-center gap-2">
                    <div className="rounded-lg border border-primary/40 bg-card px-3 py-2 text-xs font-medium text-foreground">
                      {n}
                    </div>
                    {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-primary" />}
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" aria-label="How it works" className="py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="gos-reveal text-center">
              <p className={cn(eyebrow, "brand-text")}>Process</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                From signal to signed in 3 steps.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  n: "01",
                  toneClass: "text-primary",
                  icon: Target,
                  title: "Define & Discover",
                  body: "Set your ICP once. GrowthOS agents monitor thousands of companies for buying signals — hiring, funding, tech changes — in real time.",
                },
                {
                  n: "02",
                  toneClass: "text-success",
                  icon: Send,
                  title: "Engage & Personalize",
                  body: "AI writes signal-led outreach across email, LinkedIn and WhatsApp. Every message is personalized with the exact buying signal that triggered it.",
                },
                {
                  n: "03",
                  toneClass: "text-chart-2",
                  icon: TrendingUp,
                  title: "Convert & Optimize",
                  body: "Deals flow into your AI-enriched CRM. Analytics agents surface what's working. The OS learns and improves with every campaign.",
                },
              ].map((s) => (
                <div
                  key={s.n}
                  className="gos-reveal rounded-2xl border border-border bg-card p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("font-mono text-xs font-bold", s.toneClass)}>{s.n}</span>
                    <s.icon className={cn("h-5 w-5", s.toneClass)} />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* METRICS */}
        <section aria-label="Metrics" className="border-y border-border bg-surface py-16">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 md:grid-cols-4">
            {[
              { v: "15", l: "AI Agents" },
              { v: "3x", l: "More replies vs manual outreach" },
              { v: "70%", l: "Less time on manual research" },
              { v: "500+", l: "Revenue teams using GrowthOS" },
            ].map((m) => (
              <div key={m.l} className="gos-reveal text-center">
                <div className="brand-text text-5xl font-extrabold tracking-tight md:text-[56px]">
                  {m.v}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{m.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" aria-label="Testimonials" className="py-24">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="gos-reveal text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Revenue teams love GrowthOS.
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                {
                  q: "We replaced Apollo, Outreach, and Clay with GrowthOS. One platform, 3x the pipeline.",
                  n: "Sarah Chen",
                  t: "VP Sales",
                  c: "Notion Labs",
                },
                {
                  q: "The AI agents actually collaborate. My ICP automatically feeds into every outreach sequence.",
                  n: "James Park",
                  t: "Head of Revenue",
                  c: "Linear",
                },
                {
                  q: "Our reply rates tripled in 30 days. The signal-led personalization is unreal.",
                  n: "Maya Patel",
                  t: "Founder",
                  c: "Figma Startup",
                },
              ].map((t) => (
                <figure
                  key={t.n}
                  className="gos-reveal flex flex-col rounded-2xl border border-border bg-card p-6"
                >
                  <blockquote className="italic text-foreground">"{t.q}"</blockquote>
                  <figcaption className="mt-5 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{t.n}</div>
                      <div className="text-xs text-muted-foreground">{t.t}</div>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                      {t.c}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" aria-label="Pricing" className="bg-surface py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="gos-reveal text-center">
              <p className={cn(eyebrow, "brand-text")}>Pricing</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Simple pricing. No stack sprawl.
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                One platform replaces 6+ tools.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                {
                  name: "Starter",
                  price: "$299",
                  suffix: "/mo",
                  features: [
                    "3 AI Agents active",
                    "500 leads/month",
                    "Email + LinkedIn outreach",
                    "Basic CRM",
                  ],
                  cta: "Start Free Trial",
                  highlighted: false,
                  action: goSignup,
                },
                {
                  name: "Growth",
                  price: "$799",
                  suffix: "/mo",
                  features: [
                    "All 15 AI Agents",
                    "5,000 leads/month",
                    "All outreach channels",
                    "Full CRM + Analytics",
                    "Automation Studio",
                  ],
                  cta: "Start Free Trial",
                  highlighted: true,
                  action: goSignup,
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  suffix: "",
                  features: [
                    "Unlimited everything",
                    "Custom AI rules",
                    "Dedicated onboarding",
                    "SLA + support",
                  ],
                  cta: "Talk to Sales",
                  highlighted: false,
                  action: () => (window.location.href = "mailto:sales@gallabox.com"),
                },
              ].map((p) => (
                <div
                  key={p.name}
                  className={cn(
                    "gos-reveal relative flex flex-col rounded-2xl border bg-card p-6",
                    p.highlighted ? "border-primary ai-glow" : "border-border",
                  )}
                >
                  {p.highlighted && (
                    <span className="brand-gradient absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                      Most Popular
                    </span>
                  )}
                  <div className="text-sm font-semibold text-muted-foreground">{p.name}</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-foreground">
                      {p.price}
                    </span>
                    <span className="text-sm text-muted-foreground">{p.suffix}</span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={p.action}
                    className={cn(
                      "mt-6 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all hover:brightness-110",
                      p.highlighted
                        ? "brand-gradient text-primary-foreground"
                        : "border border-border bg-transparent text-foreground hover:bg-accent",
                    )}
                  >
                    {p.cta}
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              All plans include 14-day free trial · No credit card required · Cancel anytime
            </p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section aria-label="Get started" className="py-24 text-center">
          <div className="mx-auto max-w-3xl px-5">
            <h2 className="gos-reveal text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
              Start building your AI revenue team today.
            </h2>
            <p className="gos-reveal mt-4 text-base text-muted-foreground">
              Join 500+ B2B teams running their outreach on autopilot.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={goSignup}
                className="brand-gradient ai-glow inline-flex items-center gap-2 rounded-xl px-7 py-4 text-base font-semibold text-primary-foreground"
              >
                Start Free Trial — It's Free <ArrowRight className="h-4 w-4" />
              </button>
              <button className="rounded-xl border border-border bg-card px-7 py-4 text-base font-medium text-foreground hover:bg-accent">
                Schedule a Demo
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-surface px-5 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="brand-gradient grid h-8 w-8 place-items-center rounded-lg">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </span>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Gallabox GrowthOS
              </span>
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">AI-native Revenue OS</p>
            <p className="mt-4 text-xs text-muted-foreground/70">© 2026 Gallabox GrowthOS</p>
          </div>
          <FooterCol
            title="Product"
            items={[
              "Dashboard",
              "AI Command Center",
              "Lead Intelligence",
              "Outreach Studio",
              "CRM",
              "Analytics",
            ]}
          />
          <FooterCol title="Company" items={["About", "Blog", "Careers", "Press"]} />
          <FooterCol title="Legal" items={["Privacy Policy", "Terms of Service", "Security"]} />
        </div>
        <div className="mx-auto mt-10 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
          <span>© 2026 Gallabox GrowthOS. All rights reserved.</span>
          <span className="font-mono">Made with AI</span>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className={cn(eyebrow, "text-muted-foreground")}>{title}</div>
      <ul className="mt-4 space-y-2.5">
        {items.map((i) => (
          <li key={i}>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              {i}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
