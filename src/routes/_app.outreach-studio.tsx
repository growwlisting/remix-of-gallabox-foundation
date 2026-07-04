import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Sparkles,
  Copy,
  Save,
  Mail,
  Linkedin,
  MessageCircle,
  Video,
  Phone,
  AlertTriangle,
  Check,
  Send,
  Loader2,
  Trash2,
  Info,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";

import { PageHeader } from "@/components/states/page-header";
import { getRouteMeta } from "@/lib/route-meta";
import { withLoading } from "@/components/states/page-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const meta = getRouteMeta("/outreach-studio")!;

export const Route = createFileRoute("/_app/outreach-studio")({
  head: () => ({
    meta: [
      { title: `${meta.label} · Gallabox GrowthOS` },
      { name: "description", content: meta.description },
    ],
  }),
  component: withLoading(OutreachStudioPage, "default"),
});

/* ------------------------------- Types ------------------------------- */

type Channel = "email" | "linkedin" | "whatsapp" | "video" | "call";

type StepRow = {
  id: string;
  sequence_id: string;
  step_order: number;
  label: string;
  day_offset: number;
  body: string | null;
};

type SequenceRow = {
  id: string;
  workspace_id: string;
  name: string;
  channel: Channel;
  subject: string | null;
  body: string | null;
};

const CHANNEL_META: Record<Channel, { label: string; icon: typeof Mail }> = {
  email: { label: "Email", icon: Mail },
  linkedin: { label: "LinkedIn", icon: Linkedin },
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
  video: { label: "Video", icon: Video },
  call: { label: "Call Script", icon: Phone },
};

const TONE_DOT = ["bg-emerald-500", "bg-sky-500", "bg-amber-500", "bg-violet-500", "bg-rose-500"];
const TOKENS = ["{FirstName}", "{Company}", "{Title}", "{Signal}", "{Pain}"];

function highlightTokens(text: string) {
  const parts = text.split(/(\{[A-Za-z]+\})/g);
  return parts.map((p, i) =>
    /^\{[A-Za-z]+\}$/.test(p) ? (
      <span
        key={i}
        className="rounded bg-indigo-500/10 px-1 py-0.5 font-medium text-indigo-600 dark:text-indigo-300"
      >
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

/* -------------------- AI helper (copilot-chat) -------------------- */

async function aiTransform(
  instruction: string,
  draft: string,
  contextLabel: string,
): Promise<string | null> {
  const message = `${instruction}\n\nReturn ONLY the rewritten copy, no preamble, no explanations, no quotes.\n\nCURRENT DRAFT:\n${draft}`;
  const { data, error } = await supabase.functions.invoke("copilot-chat", {
    body: { message, context: contextLabel },
  });
  if (error) {
    toast.error("AI unavailable", { description: error.message });
    return null;
  }
  const reply = (data as { reply?: string; unavailable?: boolean } | null)?.reply;
  if (!reply || (data as { unavailable?: boolean }).unavailable) {
    toast.error("AI unavailable — try again in a moment.");
    return null;
  }
  return reply.trim();
}

/* ------------------------------ Page ------------------------------ */

function OutreachStudioPage() {
  const session = useSession();
  const user = session?.user ?? null;
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [sequences, setSequences] = useState<SequenceRow[]>([]);
  const [steps, setSteps] = useState<StepRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Channel>("email");
  const [newSeqOpen, setNewSeqOpen] = useState(false);
  const [senderOpen, setSenderOpen] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("workspace_id")
        .eq("id", user.id)
        .maybeSingle();
      const ws = profile?.workspace_id ?? null;
      setWorkspaceId(ws);
      if (!ws) {
        setLoading(false);
        return;
      }
      const { data: wsRow } = await supabase
        .from("workspaces")
        .select("sender_name, sender_email")
        .eq("id", ws)
        .maybeSingle();
      setSenderName(wsRow?.sender_name ?? "GrowthOS Outreach");
      setSenderEmail(wsRow?.sender_email ?? "");

      await reload(ws);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function reload(ws: string) {
    const { data: seqs } = await supabase
      .from("sequences")
      .select("id, workspace_id, name, channel, subject, body")
      .eq("workspace_id", ws)
      .order("created_at", { ascending: true });
    const seqList = (seqs ?? []) as SequenceRow[];
    setSequences(seqList);
    if (seqList.length === 0) {
      setSteps([]);
      return;
    }
    const { data: stepRows } = await supabase
      .from("sequence_steps")
      .select("id, sequence_id, step_order, label, day_offset, body")
      .in(
        "sequence_id",
        seqList.map((s) => s.id),
      )
      .order("step_order", { ascending: true });
    setSteps((stepRows ?? []) as StepRow[]);
  }

  async function saveSenderIdentity() {
    if (!workspaceId) return;
    const { error } = await supabase
      .from("workspaces")
      .update({ sender_name: senderName || null, sender_email: senderEmail || null })
      .eq("id", workspaceId);
    if (error) {
      toast.error("Save failed", { description: error.message });
      return;
    }
    toast.success("Sender identity saved");
    setSenderOpen(false);
  }

  async function createSequence(name: string, channel: Channel) {
    if (!workspaceId || !user?.id) return;
    const seed =
      channel === "email"
        ? {
            subject: "Quick question about {Company}",
            body: `Hi {FirstName},\n\nNoticed {Company} recently {Signal}. Worth a 15-min chat?\n\n— ${senderName || "Team"}`,
          }
        : channel === "linkedin"
          ? {
              subject: "Hi {FirstName} — impressed by {Company}'s growth. Would love to connect.",
              body: `Thanks for connecting, {FirstName}! Curious how you're handling {Pain}.`,
            }
          : channel === "whatsapp"
            ? {
                subject: null,
                body: `Hi {FirstName} 👋 Saw {Company} just {Signal}. Worth a 10-min chat this week?`,
              }
            : channel === "video"
              ? {
                  subject: null,
                  body: `Hey {FirstName} — quick 60-second video walking through how we'd help with {Pain}.`,
                }
              : {
                  subject: null,
                  body: `Hey {FirstName}, this is ${senderName || "your rep"} — got 27 seconds?`,
                };

    const { data: seq, error } = await supabase
      .from("sequences")
      .insert({
        workspace_id: workspaceId,
        created_by: user.id,
        name,
        channel,
        subject: seed.subject,
        body: seed.body,
      })
      .select("id, workspace_id, name, channel, subject, body")
      .single();
    if (error || !seq) {
      toast.error("Create failed", { description: error?.message });
      return;
    }
    await supabase.from("sequence_steps").insert([
      { sequence_id: seq.id, step_order: 1, label: "First Touch", day_offset: 0, body: seed.body },
      { sequence_id: seq.id, step_order: 2, label: "Follow-up", day_offset: 3, body: null },
    ]);
    toast.success("Sequence created");
    setActiveTab(channel);
    await reload(workspaceId);
    setNewSeqOpen(false);
  }

  const channelSequences = useMemo(
    () => sequences.filter((s) => s.channel === activeTab),
    [sequences, activeTab],
  );

  return (
    <>
      <PageHeader
        eyebrow="Engagement"
        title="Outreach Studio"
        description="AI-crafted messages across every channel."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setSenderOpen(true)}>
              <Settings2 className="h-4 w-4" />
              Sender
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 text-white hover:bg-indigo-600/90"
              onClick={() => setNewSeqOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New Sequence
            </Button>
          </div>
        }
      />

      {!senderEmail && !loading ? (
        <Alert className="mt-4 border-amber-500/40 bg-amber-500/5">
          <Info className="h-4 w-4 text-amber-500" />
          <AlertTitle>Sender email not set</AlertTitle>
          <AlertDescription>
            Test emails will fail until you set a verified sender.{" "}
            <button
              className="font-medium text-indigo-600 underline underline-offset-2"
              onClick={() => setSenderOpen(true)}
            >
              Configure sender
            </button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as Channel)}
        className="mt-6"
      >
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          {(Object.keys(CHANNEL_META) as Channel[]).map((c) => {
            const M = CHANNEL_META[c].icon;
            return (
              <TabsTrigger key={c} value={c}>
                <M className="mr-1.5 h-3.5 w-3.5" />
                {CHANNEL_META[c].label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(CHANNEL_META) as Channel[]).map((c) => (
          <TabsContent key={c} value={c} className="mt-6">
            <ChannelPanel
              channel={c}
              sequences={channelSequences.length && activeTab === c ? channelSequences : sequences.filter((s) => s.channel === c)}
              steps={steps}
              senderName={senderName}
              senderEmail={senderEmail}
              onReload={() => workspaceId && reload(workspaceId)}
              onNewSequence={() => setNewSeqOpen(true)}
            />
          </TabsContent>
        ))}
      </Tabs>

      <NewSequenceDialog
        open={newSeqOpen}
        onOpenChange={setNewSeqOpen}
        defaultChannel={activeTab}
        onCreate={createSequence}
      />

      <Dialog open={senderOpen} onOpenChange={setSenderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sender identity</DialogTitle>
            <DialogDescription>
              Used as the From address for email sends. Must be a verified SendGrid sender.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">From name</Label>
              <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Ava at Gallabox" />
            </div>
            <div>
              <Label className="text-xs">From email</Label>
              <Input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="ava@yourdomain.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSenderOpen(false)}>Cancel</Button>
            <Button onClick={saveSenderIdentity}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* -------------------- New sequence dialog -------------------- */

function NewSequenceDialog({
  open,
  onOpenChange,
  defaultChannel,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultChannel: Channel;
  onCreate: (name: string, channel: Channel) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  const [busy, setBusy] = useState(false);
  useEffect(() => setChannel(defaultChannel), [defaultChannel, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New sequence</DialogTitle>
          <DialogDescription>Give it a name and pick a channel.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enterprise SaaS · Q3 outbound"
            />
          </div>
          <div>
            <Label className="text-xs">Channel</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CHANNEL_META) as Channel[]).map((c) => (
                  <SelectItem key={c} value={c}>{CHANNEL_META[c].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!name.trim() || busy}
            onClick={async () => {
              setBusy(true);
              await onCreate(name.trim(), channel);
              setBusy(false);
              setName("");
            }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Channel panel -------------------- */

function ChannelPanel({
  channel,
  sequences,
  steps,
  senderName,
  senderEmail,
  onReload,
  onNewSequence,
}: {
  channel: Channel;
  sequences: SequenceRow[];
  steps: StepRow[];
  senderName: string;
  senderEmail: string;
  onReload: () => void;
  onNewSequence: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (sequences.length === 0) {
      setSelectedId(null);
    } else if (!selectedId || !sequences.find((s) => s.id === selectedId)) {
      setSelectedId(sequences[0].id);
    }
  }, [sequences, selectedId]);

  const seq = sequences.find((s) => s.id === selectedId) ?? null;
  const seqSteps = steps.filter((s) => s.sequence_id === selectedId).sort((a, b) => a.step_order - b.step_order);

  if (channel === "linkedin" || channel === "whatsapp" || channel === "video" || channel === "call") {
    return (
      <div className="space-y-4">
        <ProviderNotice channel={channel} />
        <SequenceWorkspace
          channel={channel}
          sequences={sequences}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          seq={seq}
          seqSteps={seqSteps}
          senderName={senderName}
          senderEmail={senderEmail}
          onReload={onReload}
          onNewSequence={onNewSequence}
          sendDisabled
        />
      </div>
    );
  }

  return (
    <SequenceWorkspace
      channel={channel}
      sequences={sequences}
      selectedId={selectedId}
      setSelectedId={setSelectedId}
      seq={seq}
      seqSteps={seqSteps}
      senderName={senderName}
      senderEmail={senderEmail}
      onReload={onReload}
      onNewSequence={onNewSequence}
    />
  );
}

function ProviderNotice({ channel }: { channel: Channel }) {
  const map: Record<string, { title: string; body: string }> = {
    linkedin: {
      title: "LinkedIn is preview-only",
      body:
        "LinkedIn's public API does not permit third-party cold DMs or connection requests. To actually send from this tab you need to connect an unofficial provider like Unipile, HeyReach, or Expandi — none is configured. Draft & save copy here, then paste into LinkedIn or your provider.",
    },
    whatsapp: {
      title: "WhatsApp is preview-only",
      body:
        "Real sending needs the WhatsApp Business Cloud API (Meta) or a BSP like Gallabox / Twilio with an approved template. No provider is connected. Draft & save templates here; send from your BSP.",
    },
    video: {
      title: "Video is script-only",
      body:
        "Personalized video sending needs Loom / Vidyard / Sendspark / Tavus. None is connected. Use this tab to write & save the talk-track; record in your tool of choice.",
    },
    call: {
      title: "Call script — no dialer connected",
      body:
        "Click-to-call needs Twilio / Aircall / Dialpad. Use this tab to draft the 6-part script; log the call in CRM after dialing.",
    },
  };
  const info = map[channel];
  return (
    <Alert className="border-amber-500/40 bg-amber-500/5">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertTitle>{info.title}</AlertTitle>
      <AlertDescription>{info.body}</AlertDescription>
    </Alert>
  );
}

/* -------------------- Sequence workspace (list + editor) -------------------- */

function SequenceWorkspace({
  channel,
  sequences,
  selectedId,
  setSelectedId,
  seq,
  seqSteps,
  senderName,
  senderEmail,
  onReload,
  onNewSequence,
  sendDisabled = false,
}: {
  channel: Channel;
  sequences: SequenceRow[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  seq: SequenceRow | null;
  seqSteps: StepRow[];
  senderName: string;
  senderEmail: string;
  onReload: () => void;
  onNewSequence: () => void;
  sendDisabled?: boolean;
}) {
  if (sequences.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">
          No {CHANNEL_META[channel].label} sequences yet.
        </p>
        <Button className="mt-4 bg-indigo-600 text-white hover:bg-indigo-600/90" onClick={onNewSequence}>
          <Plus className="h-4 w-4" />
          Create first sequence
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
      <SequenceSidebar
        sequences={sequences}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        seq={seq}
        seqSteps={seqSteps}
        onReload={onReload}
      />
      <PreviewPanel
        channel={channel}
        seq={seq}
        senderName={senderName}
        senderEmail={senderEmail}
        onReload={onReload}
        sendDisabled={sendDisabled}
      />
    </div>
  );
}

/* -------------------- Sequence sidebar -------------------- */

function SequenceSidebar({
  sequences,
  selectedId,
  setSelectedId,
  seq,
  seqSteps,
  onReload,
}: {
  sequences: SequenceRow[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  seq: SequenceRow | null;
  seqSteps: StepRow[];
  onReload: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ label: string; day: number }>({ label: "", day: 0 });

  async function updateSeqName(name: string) {
    if (!seq) return;
    await supabase.from("sequences").update({ name }).eq("id", seq.id);
    onReload();
  }

  async function addStep() {
    if (!seq) return;
    const nextOrder = (seqSteps.at(-1)?.step_order ?? 0) + 1;
    const nextDay = (seqSteps.at(-1)?.day_offset ?? 0) + 3;
    await supabase.from("sequence_steps").insert({
      sequence_id: seq.id,
      step_order: nextOrder,
      label: `Step ${nextOrder}`,
      day_offset: nextDay,
      body: null,
    });
    onReload();
  }

  async function saveEdit() {
    if (!editing) return;
    await supabase
      .from("sequence_steps")
      .update({ label: draft.label, day_offset: draft.day })
      .eq("id", editing);
    setEditing(null);
    onReload();
  }

  async function removeStep(id: string) {
    await supabase.from("sequence_steps").delete().eq("id", id);
    onReload();
  }

  async function removeSequence() {
    if (!seq) return;
    if (!confirm(`Delete sequence "${seq.name}"?`)) return;
    await supabase.from("sequences").delete().eq("id", seq.id);
    onReload();
  }

  return (
    <aside className="rounded-xl border border-border bg-card p-5">
      <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Sequence
      </Label>
      <Select value={selectedId ?? ""} onValueChange={setSelectedId}>
        <SelectTrigger><SelectValue placeholder="Select a sequence" /></SelectTrigger>
        <SelectContent>
          {sequences.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {seq ? (
        <>
          <Label className="mt-4 mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Name
          </Label>
          <Input
            defaultValue={seq.name}
            key={seq.id}
            onBlur={(e) => e.target.value !== seq.name && updateSeqName(e.target.value)}
          />

          <h4 className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Steps
          </h4>
          <ol className="space-y-2">
            {seqSteps.map((s, i) => {
              const isEdit = editing === s.id;
              return (
                <li key={s.id}>
                  <div className="group flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                        TONE_DOT[i % TONE_DOT.length],
                      )}
                    >
                      {s.step_order}
                    </div>
                    {isEdit ? (
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Input
                          value={draft.label}
                          onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                          className="h-8 text-sm"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Day</span>
                          <Input
                            type="number"
                            value={draft.day}
                            onChange={(e) => setDraft((d) => ({ ...d, day: Number(e.target.value) || 0 }))}
                            className="h-8 w-16 text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">{s.label}</div>
                        <Badge variant="outline" className="mt-0.5 text-[10px]">Day {s.day_offset}</Badge>
                      </div>
                    )}
                    {isEdit ? (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          onClick={() => {
                            setEditing(s.id);
                            setDraft({ label: s.label, day: s.day_offset });
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-rose-500 opacity-0 group-hover:opacity-100"
                          onClick={() => removeStep(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                  {i < seqSteps.length - 1 ? <div className="ml-6 h-3 w-px bg-border" /> : null}
                </li>
              );
            })}
          </ol>

          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={addStep}>
            <Plus className="h-4 w-4" />
            Add Step
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full text-rose-500 hover:text-rose-600"
            onClick={removeSequence}
          >
            <Trash2 className="h-4 w-4" />
            Delete sequence
          </Button>
        </>
      ) : null}
    </aside>
  );
}

/* -------------------- Preview panel -------------------- */

function PreviewPanel({
  channel,
  seq,
  senderName,
  senderEmail,
  onReload,
  sendDisabled,
}: {
  channel: Channel;
  seq: SequenceRow | null;
  senderName: string;
  senderEmail: string;
  onReload: () => void;
  sendDisabled: boolean;
}) {
  const [subject, setSubject] = useState(seq?.subject ?? "");
  const [body, setBody] = useState(seq?.body ?? "");
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const subjectRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSubject(seq?.subject ?? "");
    setBody(seq?.body ?? "");
  }, [seq?.id]);

  if (!seq) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Select a sequence to edit.
      </section>
    );
  }

  const dirty = subject !== (seq.subject ?? "") || body !== (seq.body ?? "");

  async function save() {
    if (!seq) return;
    setSaving(true);
    const { error } = await supabase
      .from("sequences")
      .update({ subject: channel === "email" || channel === "linkedin" ? subject : null, body })
      .eq("id", seq.id);
    setSaving(false);
    if (error) toast.error("Save failed", { description: error.message });
    else {
      toast.success("Saved");
      onReload();
    }
  }

  async function copyAll() {
    const text = channel === "email" ? `Subject: ${subject}\n\n${body}` : body;
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  function insertToken(token: string) {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function runAI(label: string, instruction: string, target: "body" | "subject" | "both") {
    setAiBusy(label);
    if (target === "subject" || target === "both") {
      const next = await aiTransform(instruction, subject, `outreach-${channel}-subject`);
      if (next) setSubject(next);
    }
    if (target === "body" || target === "both") {
      const next = await aiTransform(instruction, body, `outreach-${channel}-body`);
      if (next) setBody(next);
    }
    setAiBusy(null);
  }

  async function generateWithAI() {
    setAiBusy("generate");
    const prompt = `Write a ${channel} ${channel === "email" ? "cold email (subject then body separated by a line 'BODY:')" : "message"} for ${seq!.name}. Use tokens like {FirstName}, {Company}, {Signal}, {Pain}, {Title}. Keep it concise, human, outcome-first.`;
    const out = await aiTransform(prompt, body || "(blank)", `outreach-${channel}-generate`);
    if (out) {
      if (channel === "email" && out.includes("BODY:")) {
        const [subj, ...rest] = out.split("BODY:");
        setSubject(subj.replace(/^Subject:\s*/i, "").trim());
        setBody(rest.join("BODY:").trim());
      } else {
        setBody(out);
      }
    }
    setAiBusy(null);
  }

  async function handleSendTest() {
    if (channel !== "email") return;
    if (!senderEmail) {
      toast.error("Set a verified sender email first");
      return;
    }
    if (!testEmail || !/\S+@\S+\.\S+/.test(testEmail)) {
      toast.error("Enter a valid test email address");
      return;
    }
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: testEmail,
          subject,
          body,
          fromName: senderName || "GrowthOS Outreach",
          fromEmail: senderEmail,
        },
      });
      if (error) throw error;
      if ((data as { ok?: boolean })?.ok) toast.success("Test email sent!");
      else
        toast.error("Send failed", {
          description: (data as { error?: string })?.error ?? "Check the sender is verified in SendGrid.",
        });
    } catch (err) {
      toast.error("Send failed", { description: (err as Error).message });
    } finally {
      setIsSending(false);
    }
  }

  const previewTitle =
    channel === "email" ? "Email preview" :
    channel === "linkedin" ? "LinkedIn preview" :
    channel === "whatsapp" ? "WhatsApp preview" :
    channel === "video" ? "Video script" : "Call script";

  const connectLimit = 300;
  const connectLen = subject.length;
  const connectOver = channel === "linkedin" && connectLen > connectLimit;

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold text-foreground">{previewTitle}</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={copyAll}>
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button size="sm" variant="outline" onClick={save} disabled={!dirty || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
          {channel === "email" ? (
            <>
              <Input
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="h-8 w-44 text-xs"
              />
              <Button
                size="sm"
                onClick={handleSendTest}
                disabled={isSending || sendDisabled}
                className="bg-indigo-600 text-white hover:bg-indigo-600/90"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send test
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="p-5">
        {channel === "email" ? (
          <>
            <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Subject
            </Label>
            <Input
              ref={subjectRef}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="font-medium"
            />
            <div className="mt-1.5 text-xs text-muted-foreground">
              Preview: {highlightTokens(subject)}
            </div>
          </>
        ) : channel === "linkedin" ? (
          <>
            <Label className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Connection request</span>
              <span
                className={cn(
                  "font-mono",
                  connectOver ? "text-rose-500" : connectLen > 260 ? "text-amber-500" : "text-muted-foreground",
                )}
              >
                {connectLen}/{connectLimit}
              </span>
            </Label>
            <Textarea
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              rows={3}
              className={cn(connectOver && "border-rose-500 focus-visible:ring-rose-500")}
            />
            {connectOver ? (
              <p className="mt-1 text-xs text-rose-500">Over LinkedIn's 300-character limit.</p>
            ) : null}
          </>
        ) : null}

        <Label className="mt-5 mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {channel === "linkedin" ? "Follow-up DM" : channel === "call" ? "Script" : "Body"}
        </Label>
        <Textarea
          ref={bodyRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={channel === "call" ? 12 : 8}
          className="font-mono text-sm leading-relaxed"
        />

        {channel === "whatsapp" ? (
          <div
            className="mt-5 rounded-xl border border-border p-6"
            style={{
              backgroundColor: "#e5ddd5",
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0, transparent 40%)",
            }}
          >
            <div className="ml-auto max-w-[85%]">
              <div className="rounded-lg rounded-tr-sm bg-[#dcf8c6] px-3 py-2 text-sm text-slate-900 shadow-sm">
                <div className="whitespace-pre-wrap leading-relaxed">{highlightTokens(body)}</div>
                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                  <span>10:24 AM</span>
                  <Check className="h-3 w-3" />
                  <Check className="-ml-2 h-3 w-3" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rendered preview
            </div>
            {highlightTokens(body)}
          </div>
        )}

        <div className="mt-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tokens (click to insert)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TOKENS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => insertToken(t)}
                className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-300"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          <Button size="sm" variant="outline" disabled={!!aiBusy} onClick={generateWithAI}>
            {aiBusy === "generate" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Generate with AI
          </Button>
          {[
            { key: "tone", label: "Refine Tone", instruction: "Rewrite this to sound more human, confident, and specific — no fluff." },
            { key: "short", label: "Make Shorter", instruction: "Cut this by roughly 40%, keep the strongest sentence and the CTA." },
            { key: "proof", label: "Add Social Proof", instruction: "Add one credible, specific social proof line (a metric or named similar customer)." },
          ].map((a) => (
            <Button
              key={a.key}
              size="sm"
              variant="outline"
              disabled={!!aiBusy}
              onClick={() => runAI(a.key, a.instruction, "body")}
            >
              {aiBusy === a.key ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
