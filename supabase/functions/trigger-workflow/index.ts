import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { workflowId, workflowName, workspaceId, webhookUrl, payload } = body;
    const n8nBase = Deno.env.get("N8N_WEBHOOK_BASE_URL");
    const triggeredAt = new Date().toISOString();

    if (!webhookUrl && !n8nBase) {
      return new Response(
        JSON.stringify({
          ok: true,
          status: "queued",
          workflowId,
          workflowName,
          workspaceId,
          triggeredAt,
          message: "Webhook not configured — workflow queued locally",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const targetUrl =
      webhookUrl ??
      `${n8nBase}/webhook/${String(workflowName ?? "workflow").toLowerCase().replace(/\s+/g, "-")}`;

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflowId,
        workflowName,
        workspaceId,
        triggeredAt,
        ...(payload ?? {}),
      }),
    });

    return new Response(
      JSON.stringify({ ok: res.ok, status: res.ok ? "triggered" : "failed", httpStatus: res.status, workflowId, workflowName, triggeredAt }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, status: "error", error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
