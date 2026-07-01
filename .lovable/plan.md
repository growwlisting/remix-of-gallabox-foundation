
## Gallabox GrowthOS — Application Foundation

Build a production-ready enterprise SaaS shell. No business logic — just a polished, extensible foundation with nested routing, theming, and reusable state components.

### 1. Design system (src/styles.css)

- Define a neutral enterprise palette in oklch with semantic tokens for `background`, `foreground`, `card`, `muted`, `accent`, `border`, `primary` (deep indigo/blue), `success`, `warning`, `destructive`, plus `sidebar-*` and `copilot-*` token groups.
- Dark mode via `.dark` class with matching tokens (slate/near-black surfaces, lifted card layer).
- Radius: `--radius: 0.75rem` (12px cards). Soft shadow tokens (`--shadow-sm`, `--shadow-md`, `--shadow-elevated`) using low-opacity layered shadows.
- Typography scale (display / h1 / h2 / h3 / body / small / caption) with Inter as primary font, loaded via `<link>` in `__root.tsx`.
- 8px spacing rhythm — rely on Tailwind's default 4-based scale used in multiples of 2 (gap-2, gap-4, gap-6, gap-8, p-4, p-6, p-8). Document in a short comment block.

### 2. Theme management

- `src/lib/theme-provider.tsx` — context provider supporting `light | dark | system`, persisted to `localStorage`, syncs `.dark` class on `<html>`, listens to `prefers-color-scheme`.
- `src/components/theme-toggle.tsx` — dropdown toggle (sun/moon/system) using shadcn `DropdownMenu`.
- Mount provider in `__root.tsx` inside `QueryClientProvider`.

### 3. Routing structure (TanStack Start file-based)

```
src/routes/
  __root.tsx                     // shell providers + HeadContent
  _app.tsx                       // pathless layout: AppShell with sidebar + topnav + copilot + <Outlet />
  _app.index.tsx                 // redirect → /dashboard
  _app.dashboard.tsx
  _app.ai-command-center.tsx
  _app.workspaces.tsx
  _app.market-intelligence.tsx
  _app.lead-intelligence.tsx
  _app.outreach-studio.tsx
  _app.campaign-studio.tsx
  _app.automation-studio.tsx
  _app.crm.tsx
  _app.analytics.tsx
  _app.knowledge-hub.tsx
  _app.settings.tsx
```

Each leaf route sets its own `head()` (title + description) and renders a `PageHeader` + `EmptyState` placeholder ("Module coming soon — foundation ready"). No business logic, no fake data tables.

### 4. AppShell composition (`src/components/shell/`)

- `app-shell.tsx` — CSS grid: `[sidebar] [main+topnav] [copilot]`, collapses gracefully on tablet/mobile.
- `app-sidebar.tsx` — shadcn `Sidebar` (`collapsible="icon"`), 13 nav items with lucide icons, active state via `useRouterState`, footer with org switcher placeholder + user menu.
- `app-topbar.tsx` — sticky (`sticky top-0 z-30`), contains `SidebarTrigger`, `Breadcrumbs`, `GlobalSearch` (button that opens command palette), `NotificationCenter` popover (placeholder list), `ThemeToggle`, `UserMenu`, `CopilotToggle`.
- `copilot-panel.tsx` — right-side panel (`w-96` desktop, `Sheet` on mobile), collapsible via context, header "AI Copilot", body shows empty state with suggestion chips placeholder.
- `copilot-provider.tsx` — context for open/closed state, persisted.
- `breadcrumbs.tsx` — derives from current route match labels via a `routeMeta` map.
- `org-switcher.tsx` — shadcn `DropdownMenu` showing single placeholder workspace + "Create workspace" disabled item.
- `user-menu.tsx` — avatar + dropdown (Profile / Billing / Sign out — all disabled placeholders).
- `notification-center.tsx` — bell icon + popover with empty state.

Mobile: sidebar becomes offcanvas (built into shadcn sidebar); copilot becomes a `Sheet` from the right.

### 5. Command palette (Ctrl/⌘ + K)

- `src/components/command-palette.tsx` using shadcn `CommandDialog`.
- Global `useEffect` keybind in a provider mounted in `_app.tsx`.
- Groups: **Navigation** (all 13 routes), **Actions** (Toggle theme, Toggle Copilot, Toggle sidebar), **Help** (Documentation — placeholder).

### 6. Reusable state components (`src/components/states/`)

- `loading-skeleton.tsx` — exports `SkeletonCard`, `SkeletonTable`, `SkeletonList`, `SkeletonStat` built on shadcn `Skeleton`.
- `empty-state.tsx` — icon + title + description + optional action slot, consistent spacing.
- `error-state.tsx` — icon + title + description + "Try again" action; used by route `errorComponent`.
- `page-header.tsx` — title, description, optional action slot, consistent top spacing.

### 7. Toast system

- Mount shadcn `Sonner` `<Toaster richColors position="top-right" />` in `__root.tsx`.

### 8. Error & not-found boundaries

- Root: `notFoundComponent` (already exists, refine styling to match shell).
- Each `_app.*` route: `errorComponent` using `ErrorState`, `notFoundComponent` using shell-aware 404.
- Router config: `defaultErrorComponent`.

### 9. File map (new / modified)

**New**
- `src/lib/theme-provider.tsx`
- `src/lib/route-meta.ts` (title/icon per route key for breadcrumbs + palette)
- `src/components/theme-toggle.tsx`
- `src/components/command-palette.tsx`
- `src/components/shell/{app-shell,app-sidebar,app-topbar,copilot-panel,copilot-provider,breadcrumbs,org-switcher,user-menu,notification-center}.tsx`
- `src/components/states/{loading-skeleton,empty-state,error-state,page-header}.tsx`
- `src/routes/_app.tsx` + 13 `_app.<route>.tsx` files
- `src/routes/_app.index.tsx` (redirect to `/dashboard`)

**Modified**
- `src/styles.css` — design tokens, shadows, typography
- `src/routes/__root.tsx` — Inter `<link>`, ThemeProvider, Toaster, CopilotProvider, refined error UI
- `src/routes/index.tsx` — replaced with redirect to `/dashboard` (or removed in favor of `_app.index.tsx`)
- `src/router.tsx` — `defaultErrorComponent`

### 10. Dependencies

All required shadcn primitives already exist (`sidebar`, `command`, `dialog`, `sheet`, `dropdown-menu`, `popover`, `skeleton`, `sonner`, `avatar`, `tooltip`, `separator`, `scroll-area`). No new packages needed beyond `@fontsource-variable/inter` for the font (or use a Google Fonts `<link>` in head — preferred to keep deps minimal).

### Out of scope (explicitly)

- Auth, database, real data, real notifications, real search results, real Copilot responses.
- Per-module business logic — each route is a styled empty state ready to be filled.
