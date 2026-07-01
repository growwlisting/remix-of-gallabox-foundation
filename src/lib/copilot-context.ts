import {
  Brain,
  LayoutDashboard,
  Globe2,
  Users,
  Send,
  Megaphone,
  Workflow,
  Database,
  BarChart3,
  BookOpen,
  FolderKanban,
  Settings,
  Search,
  PenLine,
  Target,
  Radar,
  UserSquare2,
  CalendarCheck2,
  MessageCircle,
  TrendingUp,
  Filter,
  Sparkles,
  Plus,
  FileText,
  Compass,
  type LucideIcon,
} from "lucide-react";

export type CopilotAction = { label: string; icon: LucideIcon };

export type CopilotContext = {
  label: string;
  icon: LucideIcon;
  summary: string;
  placeholder: string;
  actions: CopilotAction[];
};

const FALLBACK: CopilotContext = {
  label: "Workspace",
  icon: Compass,
  summary: "Ask Copilot to navigate, summarize, or take action across GrowthOS.",
  placeholder: "Ask Copilot anything…",
  actions: [
    { label: "Summarize my day", icon: Sparkles },
    { label: "What needs my attention?", icon: TrendingUp },
    { label: "Open a new agent", icon: Plus },
  ],
};

const MAP: Record<string, CopilotContext> = {
  "/dashboard": {
    label: "Dashboard",
    icon: LayoutDashboard,
    summary: "Copilot can surface revenue movements, anomalies, and team highlights for today.",
    placeholder: "Ask about pipeline, deals, or team activity…",
    actions: [
      { label: "Summarize today's pipeline movement", icon: TrendingUp },
      { label: "Flag deals that slipped this week", icon: Target },
      { label: "Draft a stand-up update", icon: PenLine },
    ],
  },
  "/ai-command-center": {
    label: "AI Command Center",
    icon: Brain,
    summary: "Orchestrate your AI workforce. Copilot can dispatch agents and chain workflows.",
    placeholder: "Tell Copilot what to delegate…",
    actions: [
      { label: "Launch new outreach mission", icon: Target },
      { label: "Which agent ran last?", icon: Sparkles },
      { label: "Show me stalled workflows", icon: TrendingUp },
    ],
  },
  "/market-intelligence": {
    label: "Market Intelligence",
    icon: Globe2,
    summary: "Track competitive moves, funding events, and category trends in your market.",
    placeholder: "Ask about accounts, competitors, or signals…",
    actions: [
      { label: "Find companies matching my ICP", icon: Search },
      { label: "Summarize competitor weaknesses", icon: TrendingUp },
      { label: "What signals fired today?", icon: Radar },
    ],
  },
  "/lead-intelligence": {
    label: "Lead Intelligence",
    icon: Users,
    summary: "Score, enrich, and prioritize prospects with grounded context.",
    placeholder: "Ask about leads, intent, or enrichment…",
    actions: [
      { label: "Score my latest import", icon: Target },
      { label: "Find hot leads in SaaS 50-200", icon: Filter },
      { label: "Who should I contact today?", icon: UserSquare2 },
    ],
  },
  "/outreach-studio": {
    label: "Outreach Studio",
    icon: Send,
    summary: "Compose, personalize, and A/B test sequences across channels.",
    placeholder: "Ask Copilot to draft or refine outreach…",
    actions: [
      { label: "Write a first-touch email for Notion", icon: PenLine },
      { label: "Refine my LinkedIn DM", icon: Sparkles },
      { label: "Generate a follow-up sequence", icon: TrendingUp },
    ],
  },
  "/campaign-studio": {
    label: "Campaign Studio",
    icon: Megaphone,
    summary: "Plan and launch multi-channel campaigns with AI-assisted segmentation.",
    placeholder: "Ask Copilot to build a campaign…",
    actions: [
      { label: "Which campaign has the best reply rate?", icon: TrendingUp },
      { label: "Pause underperforming sequences", icon: Filter },
      { label: "Launch a re-engagement wave", icon: Sparkles },
    ],
  },
  "/automation-studio": {
    label: "Automation Studio",
    icon: Workflow,
    summary: "Wire triggers, branches, and approvals into revenue workflows.",
    placeholder: "Describe the workflow you want…",
    actions: [
      { label: "Build a new enrichment workflow", icon: Plus },
      { label: "Debug stalled automation", icon: Target },
      { label: "What triggered last night?", icon: CalendarCheck2 },
    ],
  },
  "/crm": {
    label: "CRM",
    icon: Database,
    summary: "Keep accounts, contacts, and opportunities clean and current.",
    placeholder: "Ask about accounts, contacts, or deals…",
    actions: [
      { label: "Which deals are at risk?", icon: Target },
      { label: "Summarize Figma account", icon: Sparkles },
      { label: "What's blocking Stripe deal?", icon: Filter },
    ],
  },
  "/analytics": {
    label: "Analytics",
    icon: BarChart3,
    summary: "Investigate funnel drop-offs and explain revenue movements with evidence.",
    placeholder: "Ask Copilot to investigate a metric…",
    actions: [
      { label: "What drove the open rate spike?", icon: TrendingUp },
      { label: "Compare this week vs last", icon: BarChart3 },
      { label: "Which agent saved the most time?", icon: Sparkles },
    ],
  },
  "/knowledge-hub": {
    label: "Knowledge Hub",
    icon: BookOpen,
    summary: "Ground every agent in your playbooks, battlecards, and case studies.",
    placeholder: "Ask about playbooks or context…",
    actions: [
      { label: "Summarize the discovery playbook", icon: FileText },
      { label: "Find battlecard for competitor X", icon: Search },
      { label: "Refresh outdated documents", icon: Sparkles },
    ],
  },
  "/workspaces": {
    label: "Workspaces",
    icon: FolderKanban,
    summary: "Manage tenants, teams, and shared resources across the organization.",
    placeholder: "Ask about teams, tenants, or access…",
    actions: [
      { label: "Audit member access this quarter", icon: Target },
      { label: "Spin up a new workspace from template", icon: Plus },
      { label: "Show inactive members", icon: Filter },
    ],
  },
  "/settings": {
    label: "Settings",
    icon: Settings,
    summary: "Tune integrations, billing, and member preferences.",
    placeholder: "Ask Copilot to change a setting…",
    actions: [
      { label: "Check integration health", icon: Target },
      { label: "Update AI rules", icon: PenLine },
      { label: "Invite team member", icon: Users },
    ],
  },
};

export function getContextForPath(path: string): CopilotContext {
  // longest-prefix match so nested routes resolve to their parent context
  const match = Object.keys(MAP)
    .filter((k) => path === k || path.startsWith(k + "/"))
    .sort((a, b) => b.length - a.length)[0];
  return match ? MAP[match] : FALLBACK;
}
