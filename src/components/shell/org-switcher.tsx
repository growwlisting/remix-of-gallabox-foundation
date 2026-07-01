import { Building2, Check, ChevronsUpDown, LogOut, Settings as SettingsIcon, User as UserIcon } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";

export function OrgSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const navigate = useNavigate();
  const { data: profile } = useProfile();

  const displayName = profile?.full_name || profile?.email?.split("@")[0] || "You";
  const company = profile?.company || "Workspace";
  const role = profile?.role ? profile.role[0].toUpperCase() + profile.role.slice(1) : "Member";
  const initials = displayName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login", replace: true });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                {initials || <Building2 className="h-4 w-4" />}
              </div>
              {!collapsed && (
                <>
                  <div className="grid min-w-0 flex-1 text-left text-xs leading-tight">
                    <span className="truncate font-semibold text-sidebar-foreground">{displayName}</span>
                    <span className="truncate text-muted-foreground">{company} · {role}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4 opacity-60" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-64">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Signed in as</DropdownMenuLabel>
            <div className="px-2 pb-2">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings"><SettingsIcon className="mr-2 h-4 w-4" /> Profile settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/workspaces"><Building2 className="mr-2 h-4 w-4" /> Switch workspace</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// Keep unused imports referenced to avoid tree-shake warnings in strict configs.
void Check;
void UserIcon;
