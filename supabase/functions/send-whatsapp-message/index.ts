import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Service role client to bypass RLS for reading config
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get user's WAHA config
    const { data: config, error: configError } = await adminClient
      .from("evolution_config")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: "WAHA não configurado. Acesse WhatsApp > Configurações." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, group_id, text } = await req.json();

    // === TEST CONNECTION ===
    if (action === "test") {
      try {
        const res = await fetch(
          `${config.api_url}/api/sessions`,
          { headers: { "X-Api-Key": config.api_key, "Content-Type": "application/json" } }
        );
        const data = await res.json();
        const isConnected = res.ok && Array.isArray(data) && data.length > 0;

        await adminClient
          .from("evolution_config")
          .update({
            last_test_at: new Date().toISOString(),
            last_test_status: isConnected ? "success" : "failed",
          })
          .eq("user_id", userId);

        return new Response(
          JSON.stringify({ success: isConnected, data, message: isConnected ? "Conexão OK" : "Nenhuma sessão encontrada" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e) {
        await adminClient
          .from("evolution_config")
          .update({ last_test_at: new Date().toISOString(), last_test_status: "error" })
          .eq("user_id", userId);

        return new Response(
          JSON.stringify({ success: false, message: e.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // === FETCH GROUPS ===
    if (action === "fetch_groups") {
      try {
        const url = `${config.api_url}/api/${config.session_name}/groups`;
        console.log("Fetching groups from:", url);
        const res = await fetch(url, {
          headers: { "X-Api-Key": config.api_key, "Content-Type": "application/json" },
        });
        const text = await res.text();
        console.log("Groups response status:", res.status, "body:", text.substring(0, 500));
        if (!res.ok) {
          return new Response(
            JSON.stringify({ success: false, message: `WAHA retornou ${res.status}: ${text}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const data = text ? JSON.parse(text) : [];
        return new Response(JSON.stringify({ success: true, groups: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e) {
        return new Response(
          JSON.stringify({ success: false, message: e.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // === SEND MESSAGE ===
    if (action === "send") {
      if (!group_id || !text) {
        return new Response(
          JSON.stringify({ error: "group_id e text são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const res = await fetch(
          `${config.api_url}/api/sendText`,
          {
            method: "POST",
            headers: { "X-Api-Key": config.api_key, "Content-Type": "application/json" },
            body: JSON.stringify({ session: config.session_name, chatId: group_id, text }),
          }
        );
        const responseData = await res.json();

        return new Response(
          JSON.stringify({ success: res.ok, data: responseData, message: res.ok ? "Enviado" : "Falha" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e) {
        return new Response(
          JSON.stringify({ success: false, message: e.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida. Use: send, test, fetch_groups" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
