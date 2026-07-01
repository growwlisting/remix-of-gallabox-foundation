import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { OrgSwitcher } from "./org-switcher";
import { NAV_GROUPS } from "@/lib/route-meta";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border pb-3">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl brand-gradient text-brand-foreground shadow-[var(--shadow-glow)]">
            <Sparkles className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success ai-pulse" aria-hidden />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight tracking-tight text-sidebar-foreground">
                Gallabox <span className="brand-text">GrowthOS</span>
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Revenue AI · v0.1
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1">
        {NAV_GROUPS.map((group, idx) => (
          <div key={group.label}>
            {idx > 0 && !collapsed && <SidebarSeparator className="my-1 opacity-60" />}
            <SidebarGroup className="py-1.5">
              <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.items.map((item) => {
                    const active = pathname === item.path || pathname.startsWith(item.path + "/");
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.label}
                          className={
                            active
                              ? "relative bg-gradient-to-r from-sidebar-accent to-sidebar-accent/60 text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--brand)_20%,transparent)] before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r-full before:brand-gradient hover:bg-sidebar-accent"
                              : "transition-colors hover:translate-x-[1px] hover:bg-sidebar-accent/50"
                          }
                        >
                          <Link to={item.path}>
                            <Icon className={active ? "h-4 w-4 text-primary" : "h-4 w-4"} />
                            <span className={active ? "font-medium" : ""}>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>

      <SidebarSeparator />
      <SidebarFooter className="gap-2">
        <OrgSwitcher collapsed={collapsed} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
