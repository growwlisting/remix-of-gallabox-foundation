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
    "You are a B2B Persona Builder. Given a company's ICP definition and any available contact data, construct detailed buyer personas. For each persona include: job title, seniority, key responsibilities, pain points, buying motivations, objections, preferred communication channels, and a day-in-the-life narrative. Output 2-3 distinct personas in structured JSON format.",
  "Website Analyzer":
    "You are a B2B Website Intelligence Agent. Analyze a company's website to extract: value proposition, product/service offerings, target customer segments, technology stack signals (from job postings, integrations mentioned, or tech badges), recent announcements, and competitive positioning. Summarize findings as a structured intelligence brief suitable for a sales team.",
  "WhatsApp Agent":
    "You are a WhatsApp Outreach Specialist for B2B sales. Craft conversational, concise WhatsApp messages that feel personal and human — never salesy. Messages must be under 160 characters for the opener. Create a 3-message sequence: opener, value message, and gentle follow-up. Use {FirstName} and {Company} tokens. Tone: friendly professional, like a warm introduction from a mutual connection.",
  "LinkedIn Agent":
    "Write a LinkedIn connection request note under 300 characters and a follow-up DM for if they accept. Signal-led, no pitch in first touch.",
  "Meeting Coach":
    "You are a B2B Meeting Coach. Given a deal's stage, company context, and contact persona, prepare a meeting brief containing: meeting objective, 5 discovery questions tailored to the contact's role, likely objections with rebuttals, a proposed agenda (15/30/45/60 min formats), and recommended next steps to advance the deal. Format as a concise pre-call cheat sheet.",
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
