import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AGENT_PROMPTS: Record<string, string> = {
  "Sales Strategist":
    "Design a GTM strategy for a B2B SaaS company targeting mid-market. Output 3 prioritized plays.",
  "ICP Builder":
    "Analyze a B2B sales context and output a precise ICP: industry, size, title, pains, triggers.",
  "Company Research":
    "Research a company and output: business model, tech stack signals, buying committee, recent news.",
  "Outreach Writer":
    "Write a signal-led cold email under 100 words. Include a specific buying signal. No fluff.",
  "Lead Scoring":
    "You are a Lead Scoring Agent. Given a lead's profile data, score them Intent/Fit/Timing/Engagement (0-100 each), weighted overall (35/30/20/15). Return scores, reasoning, and next action.",
  "Buying Signals":
    "Monitor and report buying signals: hiring patterns, funding events, tech stack changes, intent.",
  "Campaign Builder":
    "Design a multi-channel outreach campaign. Output: audience, channels, sequence, messaging angles.",
  "Analytics Agent":
    "Analyze outreach performance data and identify the top 3 improvement opportunities.",
  "Workflow Builder":
    "Design an automation workflow for the described goal. Output: trigger, steps, conditions, actions.",
  "Memory Manager":
    "Synthesize workspace context into key facts. Output: ICP summary, top signals, active campaigns.",
  "Persona Builder":
    "You are a B2B Persona Builder. Output 2-3 detailed buyer personas as structured JSON.",
  "Website Analyzer":
    "You are a B2B Website Intelligence Agent. Extract value prop, offerings, ICP, tech stack, and competitive positioning.",
  "WhatsApp Agent":
    "You are a WhatsApp Outreach Specialist. Craft a 3-message sequence (opener under 160 chars, value message, follow-up). Use {FirstName} and {Company} tokens. Friendly professional tone.",
  "LinkedIn Agent":
    "Write a LinkedIn connection note under 300 characters and a follow-up DM. Signal-led, no pitch in first touch.",
  "Meeting Coach":
    "Prepare a meeting brief: objective, 5 discovery questions, likely objections + rebuttals, agenda, next steps.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { agentName, taskDescription, workspaceId, taskId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (taskId) {
      await supabase.from("ai_tasks").update({ status: "running", progress: 10 }).eq("id", taskId);
    }

    const prompt =
      AGENT_PROMPTS[agentName] ??
      `You are the ${agentName} agent. Complete the following task: ${taskDescription}`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content:
              taskDescription || `Run ${agentName} for workspace ${workspaceId}`,
          },
        ],
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    const ok = response.ok;
    const result = ok
      ? (data.choices?.[0]?.message?.content ?? "Agent completed.")
      : `Agent failed: ${data?.error?.message ?? response.statusText}`;

    if (taskId) {
      await supabase
        .from("ai_tasks")
        .update({ status: ok ? "completed" : "failed", progress: 100, result })
        .eq("id", taskId);
    }

    return new Response(JSON.stringify({ result, ok }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
