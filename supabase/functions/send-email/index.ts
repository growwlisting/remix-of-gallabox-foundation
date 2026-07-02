import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, subject, body, fromName, fromEmail } = await req.json();

    const apiKey = Deno.env.get("SENDGRID_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "SENDGRID_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: {
          email: fromEmail ?? "jaideep1428@gmail.com",
          name: fromName ?? "GrowthOS",
        },
        subject,
        content: [{ type: "text/plain", value: body }],
      }),
    });

    const ok = response.status >= 200 && response.status < 300;
    const errorText = ok ? null : await response.text();

    return new Response(
      JSON.stringify({ ok, status: response.status, error: errorText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
