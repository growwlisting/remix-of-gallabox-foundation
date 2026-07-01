import { useMemo, useState } from "react";
import { Bell, Flame, CheckCircle2, Mail, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Notification = {
  id: string;
  icon: LucideIcon;
  iconClass: string;
  title: string;
  time: string;
  read: boolean;
};

const INITIAL: Notification[] = [
  {
    id: "1",
    icon: Flame,
    iconClass: "text-orange-500 bg-orange-500/10",
    title: "Notion Labs — High intent signal detected",
    time: "5m ago",
    read: false,
  },
  {
    id: "2",
    icon: CheckCircle2,
    iconClass: "text-emerald-500 bg-emerald-500/10",
    title: "Lead enrichment complete — 248 leads scored",
    time: "23m ago",
    read: false,
  },
  {
    id: "3",
    icon: Mail,
    iconClass: "text-blue-500 bg-blue-500/10",
    title: "Campaign reply from Dylan Field @ Figma",
    time: "1h ago",
    read: true,
  },
  {
    id: "4",
    icon: Bot,
    iconClass: "text-violet-500 bg-violet-500/10",
    title: "AI Agent: Stalled deal re-engagement launched",
    time: "2h ago",
    read: true,
  },
];

export function NotificationCenter() {
  const [items, setItems] = useState<Notification[]>(INITIAL);
  const unread = useMemo(() => items.filter((i) => !i.read).length, [items]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground ring-2 ring-background">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <button
            className="text-xs text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            disabled={unread === 0}
            onClick={() => setItems((prev) => prev.map((i) => ({ ...i, read: true })))}
          >
            Mark all read
          </button>
        </div>
        <ul className="max-h-96 divide-y divide-border overflow-y-auto">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/60",
                !n.read && "bg-primary/[0.03]",
              )}
              onClick={() =>
                setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)))
              }
            >
              <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", n.iconClass)}>
                <n.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-foreground">{n.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.time}</p>
              </div>
              {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
            </li>
          ))}
        </ul>
        <div className="border-t border-border px-4 py-2.5 text-center">
          <button className="text-xs font-medium text-primary hover:underline">View all notifications</button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
