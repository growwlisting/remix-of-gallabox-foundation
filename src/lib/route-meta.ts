import {
  LayoutDashboard,
  Sparkles,
  FolderKanban,
  Globe2,
  Users,
  Send,
  Megaphone,
  Workflow,
  Database,
  BarChart3,
  BookOpen,
  Settings,
  Brain,
  type LucideIcon,
} from "lucide-react";

export type RouteGroup = "Home" | "Intelligence" | "Engagement" | "Operations" | "Administration";

export type RouteMeta = {
  path: string;
  label: string;
  description: string;
  icon: LucideIcon;
  group: RouteGroup;
};

export const ROUTE_META: RouteMeta[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    description: "Pipeline overview, revenue signals, and team performance at a glance.",
    icon: LayoutDashboard,
    group: "Home",
  },
  {
    path: "/ai-command-center",
    label: "AI Command Center",
    description: "Orchestrate agents, prompts, and autonomous revenue workflows.",
    icon: Brain,
    group: "Home",
  },
  {
    path: "/market-intelligence",
    label: "Market Intelligence",
    description: "Track accounts, competitors, and buying-signal trends in real time.",
    icon: Globe2,
    group: "Intelligence",
  },
  {
    path: "/lead-intelligence",
    label: "Lead Intelligence",
    description: "Enriched prospect profiles, intent scoring, and contact discovery.",
    icon: Users,
    group: "Intelligence",
  },
  {
    path: "/outreach-studio",
    label: "Outreach Studio",
    description: "Compose personalized sequences across email, LinkedIn, and WhatsApp.",
    icon: Send,
    group: "Engagement",
  },
  {
    path: "/campaign-studio",
    label: "Campaign Studio",
    description: "Plan multi-channel campaigns with AI-assisted segmentation.",
    icon: Megaphone,
    group: "Engagement",
  },
  {
    path: "/automation-studio",
    label: "Automation Studio",
    description: "Build triggers, branches, and approvals for revenue workflows.",
    icon: Workflow,
    group: "Engagement",
  },
  {
    path: "/crm",
    label: "CRM",
    description: "Accounts, contacts, opportunities, and activity history.",
    icon: Database,
    group: "Operations",
  },
  {
    path: "/analytics",
    label: "Analytics",
    description: "Cross-funnel attribution, cohort analysis, and forecasting.",
    icon: BarChart3,
    group: "Operations",
  },
  {
    path: "/knowledge-hub",
    label: "Knowledge Hub",
    description: "Playbooks, battlecards, and grounded context for every AI agent.",
    icon: BookOpen,
    group: "Operations",
  },
  {
    path: "/workspaces",
    label: "Workspaces",
    description: "Manage tenants, teams, and shared resources across the organization.",
    icon: FolderKanban,
    group: "Administration",
  },
  {
    path: "/settings",
    label: "Settings",
    description: "Organization preferences, integrations, billing, and members.",
    icon: Settings,
    group: "Administration",
  },
];

export const AI_COMMAND_META = ROUTE_META.find((r) => r.path === "/ai-command-center")!;

export function getRouteMeta(path: string): RouteMeta | undefined {
  return ROUTE_META.find((r) => r.path === path);
}

const GROUP_ORDER: RouteGroup[] = ["Home", "Intelligence", "Engagement", "Operations", "Administration"];

export const NAV_GROUPS: Array<{ label: RouteGroup; items: RouteMeta[] }> = GROUP_ORDER.map((label) => ({
  label,
  items: ROUTE_META.filter((r) => r.group === label),
}));
