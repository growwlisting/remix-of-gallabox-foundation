import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json().catch(() => ({ query: undefined }));
    const apolloKey = Deno.env.get("APOLLO_API_KEY");

    if (!apolloKey) {
      return new Response(
        JSON.stringify({ error: "APOLLO_API_KEY not configured", signals: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apolloRes = await fetch("https://api.apollo.io/api/v1/mixed_companies/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify({
        api_key: apolloKey,
        q_organization_keyword_tags: query ?? ["SaaS", "B2B", "sales"],
        per_page: 10,
        page: 1,
        organization_num_employees_ranges: ["51,500"],
      }),
    });

    const apolloData = await apolloRes.json();
    const companies = apolloData?.organizations ?? [];

    const signals = companies.map((c: any) => ({
      company: c.name,
      signal: c.short_description ?? "Company profile match",
      type: "Intent",
      strength: c.alexa_ranking && c.alexa_ranking < 100000 ? "High" : "Medium",
      detected: new Date().toISOString(),
      website: c.website_url,
      employees: c.num_employees,
      action: "Outreach",
    }));

    return new Response(JSON.stringify({ signals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), signals: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
