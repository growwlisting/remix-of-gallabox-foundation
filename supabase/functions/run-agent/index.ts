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
    "You are a Lead Scoring Agent. Given a lead's profile data (company size, industry, technology stack, recent signals, engagement history), score them on four dimensions: Intent (0-100), Fit (0-100), Timing (0-100), Engagement (0-100). Calculate an overall score as a weighted average (Intent 35%, Fit 30%, Timing 20%, Engagement 15%). Return scores, reasoning for each dimension, and a recommended next action.",
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
    "Map B2B buyer personas with specific job titles, daily pains, success metrics, objections, and messaging angles. Output 2 detailed personas.",
  "Website Analyzer":
    "Analyze a company website and extract: core value prop, target customer, pricing signals, tech stack indicators, and 3 outreach angles.",
  "WhatsApp Agent":
    "Write a compliant WhatsApp outreach message under 160 characters. Reference a specific buying signal. Include a soft CTA. No links in first message.",
  "LinkedIn Agent":
    "Write a LinkedIn connection request note under 300 characters and a follow-up DM for if they accept. Signal-led, no pitch in first touch.",
  "Meeting Coach":
    "Prepare a pre-call brief for a B2B discovery call. Output: company summary, 3 discovery questions, likely objections, talk track opener, and success criteria.",
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
