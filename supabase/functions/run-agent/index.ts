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
    "Score a B2B lead 0-100 against an ideal customer profile. Output: score, fit breakdown (industry/size/title/signals), and recommended action (outreach/nurture/disqualify).",
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
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { agentName, taskDescription, workspaceId, taskId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await supabase
      .from("ai_tasks")
      .update({ status: "running", progress: 10 })
      .eq("id", taskId);

    const prompt =
      AGENT_PROMPTS[agentName] ??
      `You are the ${agentName} agent. Complete the following task: ${taskDescription}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content:
              taskDescription || `Run ${agentName} for workspace ${workspaceId}`,
          },
        ],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const ok = response.ok;
    const result = ok
      ? (data.choices?.[0]?.message?.content ?? "Agent completed.")
      : `Agent failed: ${data?.error?.message ?? response.statusText}`;

    await supabase
      .from("ai_tasks")
      .update({
        status: ok ? "completed" : "failed",
        progress: 100,
        result,
      })
      .eq("id", taskId);

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
