import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-border/70 pb-6">
      <span
        aria-hidden
        className="absolute -top-4 left-0 h-1 w-16 rounded-full brand-gradient opacity-80"
      />
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] brand-text">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="truncate text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
