import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { PageHeader } from "@/components/states/page-header";
import { getRouteMeta } from "@/lib/route-meta";
import { withLoading } from "@/components/states/page-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type StepTone = "green" | "blue" | "amber" | "purple";
const TONE_DOT: Record<StepTone, string> = {
  green: "bg-emerald-500",
  blue: "bg-sky-500",
  amber: "bg-amber-500",
  purple: "bg-violet-500",
};
const TONE_RING: Record<StepTone, string> = {
  green: "ring-emerald-500/30",
  blue: "ring-sky-500/30",
  amber: "ring-amber-500/30",
  purple: "ring-violet-500/30",
};

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

function OutreachStudioPage() {
  return (
    <>
      <PageHeader
        eyebrow="Engagement"
        title="Outreach Studio"
        description="AI-crafted messages across every channel."
        actions={
          <Button
            size="sm"
            className="bg-indigo-600 text-white hover:bg-indigo-600/90"
          >
            <Plus className="h-4 w-4" />
            New Sequence
          </Button>
        }
      />

      <Tabs defaultValue="email" className="mt-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="email">
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            Email
          </TabsTrigger>
          <TabsTrigger value="linkedin">
            <Linkedin className="mr-1.5 h-3.5 w-3.5" />
            LinkedIn
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="video">
            <Video className="mr-1.5 h-3.5 w-3.5" />
            Video
          </TabsTrigger>
          <TabsTrigger value="call">
            <Phone className="mr-1.5 h-3.5 w-3.5" />
            Call Script
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6">
          <EmailTab />
        </TabsContent>
        <TabsContent value="linkedin" className="mt-6">
          <LinkedInTab />
        </TabsContent>
        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppTab />
        </TabsContent>
        <TabsContent value="video" className="mt-6">
          <VideoTab />
        </TabsContent>
        <TabsContent value="call" className="mt-6">
          <CallScriptTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

/* -------------------- Sequence Builder (shared shell) -------------------- */

type Step = { n: number; label: string; day: string; tone: StepTone };

function SequenceBuilder({
  name,
  steps,
  onAiClick,
}: {
  name: string;
  steps: Step[];
  onAiClick?: () => void;
}) {
  return (
    <aside className="rounded-xl border border-border bg-card p-5">
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Sequence name
      </label>
      <Input defaultValue={name} />

      <h4 className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Steps
      </h4>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={s.n}>
            <div
              className={cn(
                "group flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-all hover:ring-2",
                TONE_RING[s.tone],
                i === 0 && "ring-2",
                i === 0 && TONE_RING[s.tone],
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                  TONE_DOT[s.tone],
                )}
              >
                {s.n}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {s.label}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {s.day}
                  </Badge>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
            {i < steps.length - 1 ? (
              <div className="ml-6 h-3 w-px bg-border" />
            ) : null}
          </li>
        ))}
      </ol>

      <Button variant="outline" size="sm" className="mt-4 w-full">
        <Plus className="h-4 w-4" />
        Add Step
      </Button>

      <Button
        className="mt-3 w-full bg-indigo-600 text-white hover:bg-indigo-600/90"
        onClick={onAiClick}
      >
        <Sparkles className="h-4 w-4" />
        Generate with AI
      </Button>
    </aside>
  );
}

function PreviewShell({
  children,
  title = "Email preview",
  extraActions,
}: {
  children: React.ReactNode;
  title?: string;
  extraActions?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost">
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button size="sm" variant="outline">
            <Save className="h-4 w-4" />
            Save
          </Button>
          {extraActions}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}


function AiToolbar({ items }: { items: string[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
      {items.map((label) => (
        <Button key={label} size="sm" variant="outline">
          <Sparkles className="h-3.5 w-3.5" />
          {label}
        </Button>
      ))}
    </div>
  );
}

/* ------------------------------ EMAIL TAB ------------------------------ */

function EmailTab() {
  const steps: Step[] = [
    { n: 1, label: "First Touch Email", day: "Day 0", tone: "green" },
    { n: 2, label: "Follow-up", day: "Day 3", tone: "blue" },
    { n: 3, label: "Breakup Email", day: "Day 7", tone: "amber" },
    { n: 4, label: "Re-engage", day: "Day 14", tone: "purple" },
  ];

  const [subject, setSubject] = useState(
    "Quick question about {Company}'s sales process",
  );
  const [body, setBody] = useState(
    `Hi {FirstName},

Noticed {Company} just {Signal} — congrats. Teams scaling that fast usually hit {Pain} within 90 days.

We help {Title}s at similar-stage SaaS companies compress their sales cycle by 30%. Worth a 15-min chat next week to see if it fits?

— Ava`,
  );
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendTest = async () => {
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
          fromName: "GrowthOS Outreach",
        },
      });
      if (error) throw error;
      if (data?.ok) toast.success("Test email sent!");
      else
        toast.error("Send failed", {
          description: data?.error ?? "Check your SendGrid key in Supabase secrets.",
        });
    } catch (err) {
      toast.error("Send failed", { description: (err as Error).message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
      <SequenceBuilder name="Enterprise SaaS · Q3 outbound" steps={steps} />

      <PreviewShell
        extraActions={
          <div className="flex items-center gap-1.5">
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
              disabled={isSending}
              className="bg-indigo-600 text-white hover:bg-indigo-600/90"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send test
            </Button>
          </div>
        }
      >

        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Subject
        </label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="font-medium"
        />
        <div className="mt-1.5 text-xs text-muted-foreground">
          Preview: {highlightTokens(subject)}
        </div>

        <label className="mt-5 mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Body
        </label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="font-mono text-sm leading-relaxed"
        />

        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Rendered preview
          </div>
          {highlightTokens(body)}
        </div>

        <div className="mt-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tokens
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TOKENS.map((t) => (
              <button
                key={t}
                type="button"
                className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-500/15 dark:text-indigo-300"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <AiToolbar items={["Refine Tone", "Make Shorter", "Add Social Proof"]} />
      </PreviewShell>
    </div>
  );
}

/* ---------------------------- LINKEDIN TAB ---------------------------- */

function LinkedInTab() {
  const steps: Step[] = [
    { n: 1, label: "Connection Request", day: "Day 0", tone: "green" },
    { n: 2, label: "Follow-up DM", day: "Day 4", tone: "blue" },
  ];

  const [connect, setConnect] = useState(
    "Hi {FirstName} — impressed by {Company}'s growth. Would love to connect.",
  );
  const [dm, setDm] = useState(
    `Thanks for connecting, {FirstName}!

Saw {Company} recently {Signal}. Curious how you're handling {Pain} at your current scale — happy to share what's worked for similar {Title}s.

Open to a quick chat?`,
  );

  const connectLimit = 300;
  const connectLeft = connectLimit - connect.length;
  const connectOver = connectLeft < 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong>2-DM max rule:</strong> LinkedIn throttles accounts that send more
          than 2 unanswered messages per prospect. Keep sequences short.
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
        <SequenceBuilder name="LinkedIn · Founder outbound" steps={steps} />

        <PreviewShell title="LinkedIn preview">
          <label className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Connection request</span>
            <span
              className={cn(
                "font-mono",
                connectOver
                  ? "text-rose-500"
                  : connectLeft < 40
                    ? "text-amber-500"
                    : "text-muted-foreground",
              )}
            >
              {connect.length}/{connectLimit}
            </span>
          </label>
          <Textarea
            value={connect}
            onChange={(e) => setConnect(e.target.value)}
            rows={3}
            className={cn(connectOver && "border-rose-500 focus-visible:ring-rose-500")}
          />
          {connectOver ? (
            <p className="mt-1 text-xs text-rose-500">
              Over LinkedIn's 300-character connection note limit.
            </p>
          ) : null}

          <label className="mt-5 mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Follow-up DM
          </label>
          <Textarea
            value={dm}
            onChange={(e) => setDm(e.target.value)}
            rows={7}
            className="font-mono text-sm leading-relaxed"
          />

          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
            {highlightTokens(dm)}
          </div>

          <AiToolbar items={["Refine Tone", "Make Shorter", "Add Social Proof"]} />
        </PreviewShell>
      </div>
    </div>
  );
}

/* ---------------------------- WHATSAPP TAB ---------------------------- */

function WhatsAppTab() {
  const steps: Step[] = [
    { n: 1, label: "Opening Template", day: "Day 0", tone: "green" },
    { n: 2, label: "Value Nudge", day: "Day 2", tone: "blue" },
    { n: 3, label: "Meeting Ask", day: "Day 5", tone: "purple" },
  ];

  const [msg, setMsg] = useState(
    `Hi {FirstName} 👋

Saw {Company} just {Signal}. We help {Title}s at similar teams cut ramp time in half.

Worth a 10-min chat this week?`,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
      <SequenceBuilder name="WhatsApp · Inbound welcome" steps={steps} />

      <PreviewShell title="WhatsApp preview">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Template body
        </label>
        <Textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={7}
          className="font-mono text-sm leading-relaxed"
        />

        <div className="mt-2 flex flex-wrap gap-1.5">
          {TOKENS.map((t) => (
            <button
              key={t}
              type="button"
              className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-300"
            >
              {t}
            </button>
          ))}
        </div>

        <div
          className="mt-5 rounded-xl border border-border p-6"
          style={{
            backgroundColor: "#e5ddd5",
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0, transparent 40%)",
          }}
        >
          <div className="ml-auto max-w-[85%]">
            <div className="relative rounded-lg rounded-tr-sm bg-[#dcf8c6] px-3 py-2 text-sm text-slate-900 shadow-sm">
              <div className="whitespace-pre-wrap leading-relaxed">
                {highlightTokens(msg)}
              </div>
              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                <span>10:24 AM</span>
                <Check className="h-3 w-3" />
                <Check className="-ml-2 h-3 w-3" />
              </div>
            </div>
          </div>
        </div>

        <AiToolbar items={["Refine Tone", "Make Shorter", "Add Emoji"]} />
      </PreviewShell>
    </div>
  );
}

/* ------------------------------ VIDEO TAB ------------------------------ */

function VideoTab() {
  const steps: Step[] = [
    { n: 1, label: "Personalized Intro", day: "Day 0", tone: "green" },
    { n: 2, label: "Product Walkthrough", day: "Day 3", tone: "blue" },
    { n: 3, label: "Follow-up Loom", day: "Day 7", tone: "purple" },
  ];

  const [script, setScript] = useState(
    `Hey {FirstName} — quick 60-second video for you.

Noticed {Company} just {Signal}. I recorded a walkthrough showing exactly how we'd solve {Pain} for a team your size.

Let me know what you think.`,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
      <SequenceBuilder name="Video · Enterprise ABM" steps={steps} />

      <PreviewShell title="Video script">
        <div className="flex aspect-video items-center justify-center rounded-lg border border-border bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-transparent">
          <div className="text-center">
            <Video className="mx-auto h-8 w-8 text-indigo-500" />
            <p className="mt-2 text-sm text-muted-foreground">
              AI-personalized video · 60s
            </p>
          </div>
        </div>

        <label className="mt-5 mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Talk track
        </label>
        <Textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={8}
          className="font-mono text-sm leading-relaxed"
        />

        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
          {highlightTokens(script)}
        </div>

        <AiToolbar items={["Refine Tone", "Make Shorter", "Add Hook"]} />
      </PreviewShell>
    </div>
  );
}

/* --------------------------- CALL SCRIPT TAB --------------------------- */

const CALL_PARTS: {
  id: string;
  label: string;
  hint: string;
  script: string;
}[] = [
  {
    id: "opener",
    label: "Opener",
    hint: "Pattern-interrupt in under 10 seconds",
    script:
      "Hey {FirstName}, this is Ava from Gallabox — I know you weren't expecting my call. Got 27 seconds for me to tell you why I'm calling, then you can decide if it's worth continuing?",
  },
  {
    id: "permission",
    label: "Permission",
    hint: "Earn the right to keep talking",
    script:
      "Appreciate that. I'll be quick — if this isn't relevant I'll happily get off the phone.",
  },
  {
    id: "pain",
    label: "Pain",
    hint: "Reference a signal, not a pitch",
    script:
      "Reason I'm reaching out — noticed {Company} recently {Signal}. When {Title}s hit that stage, {Pain} usually shows up within a quarter. Is that on your radar?",
  },
  {
    id: "pitch",
    label: "Pitch",
    hint: "One sentence, outcome-first",
    script:
      "We help teams like yours compress sales cycles by ~30% by giving reps AI-scored leads and one-click multichannel outreach.",
  },
  {
    id: "objection",
    label: "Objection Handle",
    hint: "Acknowledge → reframe → ask",
    script:
      "Totally fair — most folks I speak with say the same before seeing it. Would it be unreasonable to grab 15 minutes next week just to see if it's a fit?",
  },
  {
    id: "close",
    label: "Close",
    hint: "Give two calendar options",
    script:
      "How's Tuesday at 10 or Thursday at 2 your time? I'll send an invite the moment we hang up.",
  },
];

function CallScriptTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
      <aside className="rounded-xl border border-border bg-card p-5">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Script name
        </label>
        <Input defaultValue="Cold call · Series B SaaS" />

        <div className="mt-6 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            6-part framework
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Structured for cold outbound. Each part flows to the next — expand any
            section to edit the script.
          </p>
        </div>

        <Button className="mt-4 w-full bg-indigo-600 text-white hover:bg-indigo-600/90">
          <Sparkles className="h-4 w-4" />
          Generate with AI
        </Button>
      </aside>

      <PreviewShell title="Call script">
        <Accordion type="multiple" defaultValue={["opener"]} className="w-full">
          {CALL_PARTS.map((part, i) => (
            <AccordionItem key={part.id} value={part.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {part.label}
                    </div>
                    <div className="text-xs text-muted-foreground">{part.hint}</div>
                  </div>
                </div>
                
              </AccordionTrigger>
              <AccordionContent>
                <Textarea
                  defaultValue={part.script}
                  rows={4}
                  className="font-mono text-sm leading-relaxed"
                />
                <div className="mt-2 rounded-md border border-border bg-muted/30 p-2.5 text-sm leading-relaxed">
                  {highlightTokens(part.script)}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <AiToolbar items={["Refine Tone", "Make Shorter", "Add Social Proof"]} />
      </PreviewShell>
    </div>
  );
}
