import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { source_id, site_name, source } = body;

    if (source === "shopee") {
      // Auth: extract user from JWT
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch credentials from source_credentials
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { data: creds, error: credsError } = await adminClient
        .from("source_credentials")
        .select("credentials")
        .eq("user_id", user.id)
        .eq("source_name", "shopee")
        .maybeSingle();

      if (credsError || !creds) {
        return new Response(JSON.stringify({ error: "Credenciais Shopee não configuradas." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { app_id, app_secret } = creds.credentials as { app_id: string; app_secret: string };

      // Forward to Railway
      const res = await fetch(
        "https://fast-api-scrapers-radar-production.up.railway.app/api/scrape/shopee",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app_id, app_secret, user_id: user.id }),
        }
      );

      const resBody = await res.text();
      return new Response(resBody, {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default flow: generic scraper
    const res = await fetch(
      "https://fast-api-scrapers-radar-production.up.railway.app/api/start-scrape",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_id, site_name }),
      }
    );

    const resBody = await res.text();

    return new Response(resBody, {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
