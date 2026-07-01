import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import { getRouteMeta } from "@/lib/route-meta";

export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const meta = getRouteMeta(path);
    return { path, label: meta?.label ?? toTitle(seg) };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
      <Link
        to="/dashboard"
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Home"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((c, i) => (
        <div key={c.path} className="flex min-w-0 items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          {i === crumbs.length - 1 ? (
            <span className="truncate font-medium text-foreground">{c.label}</span>
          ) : (
            <Link to={c.path} className="truncate text-muted-foreground hover:text-foreground">
              {c.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

function toTitle(s: string) {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
