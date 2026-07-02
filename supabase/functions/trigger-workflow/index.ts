import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { workflowName, webhookUrl, payload } = await req.json();
    const n8nBase = Deno.env.get("N8N_WEBHOOK_BASE_URL");

    if (!webhookUrl && !n8nBase) {
      return new Response(
        JSON.stringify({ ok: false, error: "N8N_WEBHOOK_BASE_URL not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const targetUrl =
      webhookUrl ??
      `${n8nBase}/webhook/${String(workflowName).toLowerCase().replace(/\s+/g, "-")}`;

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflowName,
        triggeredAt: new Date().toISOString(),
        ...(payload ?? {}),
      }),
    });

    return new Response(JSON.stringify({ ok: res.ok, status: res.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
