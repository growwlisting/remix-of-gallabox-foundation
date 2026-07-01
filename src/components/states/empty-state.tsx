import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = "",
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-gradient-to-b from-card/80 to-card/40 px-8 py-16 text-center shadow-[var(--shadow-soft)] ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 -top-20 mx-auto h-40 w-40 rounded-full opacity-30 blur-3xl brand-gradient"
        aria-hidden
      />
      <div className="relative mb-4 grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground transition-shadow hover:shadow-[var(--shadow-glow)]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="relative text-base font-semibold tracking-tight text-foreground">{title}</h3>
      {description ? (
        <p className="relative mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="relative mt-6">{action}</div> : null}
    </div>
  );
}
