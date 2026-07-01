import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Plus,
  Search,
  FileText,
  Target,
  Wand2,
  Mail,
  Bot,
  Pencil,
  Trash2,
  Files,
} from "lucide-react";

import { PageHeader } from "@/components/states/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/knowledge-hub")({
  component: withLoading(KnowledgeHubPage, "columns"),
});

const categories = [
  { id: "all", label: "All Documents", count: 24, icon: Files },
  { id: "product", label: "Product Brief", count: 3, icon: FileText },
  { id: "icp", label: "ICP & Personas", count: 6, icon: Target },
  { id: "prompts", label: "Prompt Library", count: 8, icon: Wand2 },
  { id: "email", label: "Email Templates", count: 4, icon: Mail },
  { id: "rules", label: "AI Rules", count: 3, icon: Bot },
];

const categoryStyles: Record<string, string> = {
  "Product Brief": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "ICP & Personas": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "Prompt Library": "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  "Email Templates": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "AI Rules": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const documents = [
  {
    id: "1",
    title: "Product Brief v2.1",
    category: "Product Brief",
    updated: "2d ago",
    agents: 8,
    preview:
      "Gallabox GrowthOS is an AI-native Revenue Operating System that unifies ICP creation, prospecting, outreach, campaigns, CRM and analytics for B2B sales teams...",
  },
  {
    id: "2",
    title: "ICP Definition — SaaS 50-500",
    category: "ICP & Personas",
    updated: "5d ago",
    agents: 6,
    preview:
      "Target B2B SaaS companies between 50-500 employees in North America and India. Primary personas: VP Sales, Head of Growth, RevOps leaders...",
  },
  {
    id: "3",
    title: "Cold Email Framework",
    category: "Prompt Library",
    updated: "1d ago",
    agents: 3,
    preview:
      "A four-part framework: (1) contextual opener grounded in a buying signal, (2) pain hypothesis, (3) light social proof, (4) low-friction CTA...",
  },
  {
    id: "4",
    title: "LinkedIn DM Rules (2-DM Max)",
    category: "Prompt Library",
    updated: "3d ago",
    agents: 2,
    preview:
      "Never send more than two LinkedIn DMs to a single prospect. First DM references a public signal. Second DM offers a concrete resource...",
  },
  {
    id: "5",
    title: "Objection Handling Guide",
    category: "Email Templates",
    updated: "1w ago",
    agents: 4,
    preview:
      "Responses for the eight most common objections: budget, timing, incumbent tool, low priority, no pain, wrong contact, decision by committee, evaluation freeze...",
  },
  {
    id: "6",
    title: "AI Agent Behavior Rules",
    category: "AI Rules",
    updated: "4d ago",
    agents: 15,
    preview:
      "Global operating rules for every agent: personalize on a specific buying signal, keep first-touch emails under 100 words, never mention competitors by name...",
  },
];

function KnowledgeHubPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedId, setSelectedId] = useState("1");
  const [query, setQuery] = useState("");

  const filtered = documents.filter((doc) => {
    if (!query) return true;
    return doc.title.toLowerCase().includes(query.toLowerCase());
  });

  const selected = documents.find((d) => d.id === selectedId) ?? documents[0];

  return (
    <div className="flex h-full flex-col gap-6">
      <PageHeader
        title="Knowledge Hub"
        description="Your AI's brain — product context, prompts, and memory."
        actions={
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        }
      />

      <div className="grid min-h-[640px] flex-1 grid-cols-12 gap-4">
        {/* LEFT — Categories */}
        <aside className="col-span-12 rounded-xl border border-border bg-card p-3 md:col-span-3 lg:col-span-3">
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Categories
          </p>
          <nav className="space-y-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-indigo-600 text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{cat.label}</span>
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-xs",
                      active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* CENTER — Document list */}
        <section className="col-span-12 flex flex-col rounded-xl border border-border bg-card md:col-span-5 lg:col-span-6">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {filtered.map((doc) => {
              const isSelected = selectedId === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedId(doc.id)}
                  className={cn(
                    "group cursor-pointer rounded-lg border border-border bg-background p-4 transition-all hover:border-indigo-500/40 hover:shadow-sm",
                    isSelected && "border-l-4 border-l-indigo-600 bg-indigo-500/5",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-foreground">{doc.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("border text-xs font-medium", categoryStyles[doc.category])}
                        >
                          {doc.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Updated {doc.updated}</span>
                        <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                          Used by {doc.agents} agents
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT — Preview */}
        <aside className="col-span-12 flex flex-col rounded-xl border border-border bg-card md:col-span-4 lg:col-span-3">
          <div className="p-4">
            <h2 className="text-base font-semibold text-foreground">{selected.title}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn("border text-xs font-medium", categoryStyles[selected.category])}
              >
                {selected.category}
              </Badge>
              <span className="text-xs text-muted-foreground">Updated {selected.updated}</span>
              <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                Used by {selected.agents} agents
              </span>
            </div>
          </div>
          <Separator />
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{selected.preview}</p>
            <button className="mt-3 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Read More →
            </button>
          </div>
          <div className="flex flex-col gap-2 border-t border-border p-4">
            <Button variant="outline" className="w-full">
              <Pencil className="mr-2 h-4 w-4" />
              Edit Document
            </Button>
            <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
              <Bot className="mr-2 h-4 w-4" />
              Use in Agent
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
