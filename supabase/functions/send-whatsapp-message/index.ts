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
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

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

    const baseUrl = config.api_url.replace(/\/+$/, '');
    const { action, group_id, text } = await req.json();

    // === TEST CONNECTION ===
    if (action === "test") {
      try {
        const url = `${baseUrl}/api/sessions`;
        console.log("Test URL:", url);
        const res = await fetch(
          url,
          { headers: { "X-Api-Key": config.api_key, "Content-Type": "application/json" } }
        );
        const resText = await res.text();
        console.log("Test response status:", res.status);
        console.log("Test response body:", resText.substring(0, 500));
        let data;
        try { data = resText ? JSON.parse(resText) : null; } catch { data = null; }
        const isConnected = res.ok && data != null &&
          (Array.isArray(data) ? data.length > 0 : typeof data === 'object');

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
      const maxRetries = 2;
      const timeoutMs = 60000;
      const retryDelayMs = 2000;
      const url = `${baseUrl}/api/${config.session_name}/groups?limit=50&offset=0`;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Fetching groups (attempt ${attempt}/${maxRetries}) from: ${url}`);
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);

          const res = await fetch(url, {
            headers: { "X-Api-Key": config.api_key, "Content-Type": "application/json" },
            signal: controller.signal,
          });
          clearTimeout(timer);

          const text = await res.text();
          console.log("Groups response status:", res.status, "body:", text.substring(0, 500));

          if (!res.ok) {
            const msg = `WAHA retornou ${res.status}: ${text.substring(0, 200)}`;
            if (attempt < maxRetries) {
              console.log(`Retrying in ${retryDelayMs}ms...`);
              await new Promise((r) => setTimeout(r, retryDelayMs));
              continue;
            }
            return new Response(
              JSON.stringify({ success: false, message: msg }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          let data;
          try { data = (text && text.trim()) ? JSON.parse(text) : []; } catch { data = []; }
          return new Response(JSON.stringify({ success: true, groups: data }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (e) {
          const isTimeout = e.name === "AbortError";
          const msg = isTimeout
            ? "Timeout ao listar grupos. Tente reiniciar a sessão no WAHA."
            : e.message;
          console.log(`Fetch groups error (attempt ${attempt}): ${msg}`);
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, retryDelayMs));
            continue;
          }
          return new Response(
            JSON.stringify({ success: false, message: msg }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
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
          `${baseUrl}/api/sendText`,
          {
            method: "POST",
            headers: { "X-Api-Key": config.api_key, "Content-Type": "application/json" },
            body: JSON.stringify({ session: config.session_name, chatId: group_id, text }),
          }
        );
        const resText = await res.text();
        let responseData;
        try { responseData = resText ? JSON.parse(resText) : {}; } catch { responseData = { raw: resText }; }

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
