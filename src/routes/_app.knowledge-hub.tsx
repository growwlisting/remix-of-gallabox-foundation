import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Loader2,
} from "lucide-react";

import { PageHeader } from "@/components/states/page-header";
import { withLoading } from "@/components/states/page-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { relTime } from "@/hooks/use-growth-data";

export const Route = createFileRoute("/_app/knowledge-hub")({
  component: withLoading(KnowledgeHubPage, "columns"),
});

type Category =
  | "Product Brief"
  | "ICP & Personas"
  | "Prompt Library"
  | "Email Templates"
  | "AI Rules";

type KnowledgeDoc = {
  id: string;
  workspace_id: string;
  title: string;
  category: Category;
  content: string;
  preview: string;
  agent_count: number;
  created_at: string;
  updated_at: string;
};

const CATEGORY_META: { id: "all" | Category; label: string; icon: typeof Files }[] = [
  { id: "all", label: "All Documents", icon: Files },
  { id: "Product Brief", label: "Product Brief", icon: FileText },
  { id: "ICP & Personas", label: "ICP & Personas", icon: Target },
  { id: "Prompt Library", label: "Prompt Library", icon: Wand2 },
  { id: "Email Templates", label: "Email Templates", icon: Mail },
  { id: "AI Rules", label: "AI Rules", icon: Bot },
];

const categoryStyles: Record<Category, string> = {
  "Product Brief": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "ICP & Personas": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "Prompt Library": "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  "Email Templates": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "AI Rules": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const CATEGORIES: Category[] = [
  "Product Brief",
  "ICP & Personas",
  "Prompt Library",
  "Email Templates",
  "AI Rules",
];

// Table not yet in generated types — use a loose client for this table only.
const db = supabase as unknown as {
  from: (t: string) => ReturnType<typeof supabase.from>;
};

function useDocs() {
  const { data: profile } = useProfile();
  const workspaceId = profile?.workspace_id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["knowledge_documents", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<KnowledgeDoc[]> => {
      const { data, error } = await db
        .from("knowledge_documents")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as KnowledgeDoc[];
    },
  });

  useEffect(() => {
    if (typeof window === "undefined" || !workspaceId) return;
    const channel = supabase
      .channel(`knowledge-${Math.random().toString(36).slice(2, 7)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "knowledge_documents" },
        () => qc.invalidateQueries({ queryKey: ["knowledge_documents", workspaceId] }),
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [qc, workspaceId]);

  return query;
}

function KnowledgeHubPage() {
  const { data: profile } = useProfile();
  const workspaceId = profile?.workspace_id ?? null;
  const qc = useQueryClient();

  const { data: docs = [], isLoading } = useDocs();

  const [activeCategory, setActiveCategory] = useState<"all" | Category>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: docs.length };
    for (const cat of CATEGORIES) c[cat] = 0;
    for (const d of docs) c[d.category] = (c[d.category] ?? 0) + 1;
    return c;
  }, [docs]);

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (activeCategory !== "all" && d.category !== activeCategory) return false;
      if (query && !d.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [docs, activeCategory, query]);

  // Keep selection valid
  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.find((d) => d.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = docs.find((d) => d.id === selectedId) ?? null;

  const createMut = useMutation({
    mutationFn: async (payload: { title: string; category: Category; content: string }) => {
      if (!workspaceId) throw new Error("No workspace");
      const preview = payload.content.slice(0, 220) + (payload.content.length > 220 ? "..." : "");
      const { data, error } = await db
        .from("knowledge_documents")
        .insert({
          workspace_id: workspaceId,
          title: payload.title,
          category: payload.category,
          content: payload.content,
          preview,
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as KnowledgeDoc;
    },
    onSuccess: (doc) => {
      toast.success("Document added");
      qc.invalidateQueries({ queryKey: ["knowledge_documents", workspaceId] });
      setSelectedId(doc.id);
      setAddOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async (payload: { id: string; title: string; category: Category; content: string }) => {
      const preview = payload.content.slice(0, 220) + (payload.content.length > 220 ? "..." : "");
      const { error } = await db
        .from("knowledge_documents")
        .update({
          title: payload.title,
          category: payload.category,
          content: payload.content,
          preview,
        } as never)
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document updated");
      qc.invalidateQueries({ queryKey: ["knowledge_documents", workspaceId] });
      setEditOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("knowledge_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document deleted");
      qc.invalidateQueries({ queryKey: ["knowledge_documents", workspaceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex h-full flex-col gap-6">
      <PageHeader
        title="Knowledge Hub"
        description="Your AI's brain — product context, prompts, and memory."
        actions={
          <Button
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => setAddOpen(true)}
          >
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
            {CATEGORY_META.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.id;
              const count = counts[cat.id] ?? 0;
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
                    {count}
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
            {isLoading && (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading documents...
              </div>
            )}
            {!isLoading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
                <Files className="h-8 w-8" />
                <p className="text-sm">No documents{activeCategory !== "all" ? ` in ${activeCategory}` : ""}.</p>
                <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add your first document
                </Button>
              </div>
            )}
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
                        <span className="text-xs text-muted-foreground">
                          Updated {relTime(doc.updated_at)}
                        </span>
                        <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                          Used by {doc.agent_count} agents
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(doc.id);
                          setEditOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-500 hover:text-rose-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${doc.title}"?`)) deleteMut.mutate(doc.id);
                        }}
                      >
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
          {selected ? (
            <>
              <div className="p-4">
                <h2 className="text-base font-semibold text-foreground">{selected.title}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("border text-xs font-medium", categoryStyles[selected.category])}
                  >
                    {selected.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Updated {relTime(selected.updated_at)}
                  </span>
                  <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    Used by {selected.agent_count} agents
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex-1 overflow-y-auto whitespace-pre-wrap p-4 text-sm leading-relaxed text-muted-foreground">
                {selected.content || selected.preview}
              </div>
              <div className="flex flex-col gap-2 border-t border-border p-4">
                <Button variant="outline" className="w-full" onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Document
                </Button>
                <Button
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={() => toast.success(`"${selected.title}" attached to next agent run`)}
                >
                  <Bot className="mr-2 h-4 w-4" />
                  Use in Agent
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Select a document to preview.
            </div>
          )}
        </aside>
      </div>

      <DocDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Document"
        submitLabel="Create Document"
        defaultCategory={activeCategory === "all" ? "Product Brief" : activeCategory}
        submitting={createMut.isPending}
        onSubmit={(v) => createMut.mutate(v)}
      />
      <DocDialog
        open={editOpen && !!selected}
        onOpenChange={setEditOpen}
        title="Edit Document"
        submitLabel="Save Changes"
        initial={selected ?? undefined}
        submitting={updateMut.isPending}
        onSubmit={(v) => selected && updateMut.mutate({ id: selected.id, ...v })}
      />
    </div>
  );
}

function DocDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  initial,
  defaultCategory = "Product Brief",
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  submitLabel: string;
  initial?: KnowledgeDoc;
  defaultCategory?: Category;
  submitting: boolean;
  onSubmit: (v: { title: string; category: Category; content: string }) => void;
}) {
  const [docTitle, setDocTitle] = useState("");
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (open) {
      setDocTitle(initial?.title ?? "");
      setCategory(initial?.category ?? defaultCategory);
      setContent(initial?.content ?? "");
    }
  }, [open, initial, defaultCategory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Documents feed context to every AI agent in this workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g. ICP — Mid-market SaaS"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the guidance, prompt, or context here..."
              className="min-h-[180px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={submitting || !docTitle.trim() || !content.trim()}
            onClick={() => onSubmit({ title: docTitle.trim(), category, content: content.trim() })}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
