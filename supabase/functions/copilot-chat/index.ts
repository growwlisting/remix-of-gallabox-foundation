import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, context, history } = (await req.json()) as {
      message: string;
      context?: string;
      history?: ChatMessage[];
    };

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FRIENDLY_UNAVAILABLE =
      "AI Copilot is temporarily unavailable. Please try again in a moment.";

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ reply: FRIENDLY_UNAVAILABLE, unavailable: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are the AI Copilot for Gallabox GrowthOS — an AI-native Revenue Operating System for B2B sales teams. You help revenue teams with prospecting, outreach, campaigns, CRM, and analytics.

Current page context: ${context ?? "unknown"}

Be concise, specific, and actionable. Always respond in 2-4 sentences max unless asked for more.
Suggest concrete next steps. Use data-driven language. Never be generic.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...(Array.isArray(history) ? history : []),
          { role: "user", content: message },
        ],
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Gateway error", response.status, text);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ reply: "Rate limit reached. Please try again shortly.", unavailable: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ reply: "AI credits exhausted for this workspace.", unavailable: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ reply: FRIENDLY_UNAVAILABLE, unavailable: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "I could not process that request.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("copilot-chat error", err);
    return new Response(
      JSON.stringify({
        reply: "AI Copilot hit an unexpected error. Please try again in a moment.",
        unavailable: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
