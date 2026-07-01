import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function OrgSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              {!collapsed && (
                <>
                  <div className="grid min-w-0 flex-1 text-left text-xs leading-tight">
                    <span className="truncate font-semibold text-sidebar-foreground">Acme Revenue</span>
                    <span className="truncate text-muted-foreground">Enterprise · 24 seats</span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4 opacity-60" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-64">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
            <DropdownMenuItem className="gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Acme Revenue</p>
                <p className="text-xs text-muted-foreground">Enterprise plan</p>
              </div>
              <Check className="h-4 w-4 text-primary" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="gap-2">
              <Plus className="h-4 w-4" /> Create workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
