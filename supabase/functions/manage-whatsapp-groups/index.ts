import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return jsonResponse({ error: "Unauthorized" }, 401);
    const user = { id: claimsData.claims.sub as string };
    const userId = user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get Evolution config
    const { data: config, error: configError } = await adminClient
      .from("evolution_config")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (configError || !config) {
      return jsonResponse({ error: "Evolution API não configurada." }, 400);
    }

    const baseUrl = config.api_url.replace(/\/+$/, "");
    const instanceName = config.session_name;
    const apiHeaders = { apikey: config.api_key, "Content-Type": "application/json" };

    const body = await req.json();
    const { action } = body;

    // ===== SYNC COUNTS =====
    if (action === "sync_counts") {
      const url = `${baseUrl}/group/fetchAllGroups/${instanceName}?getParticipants=false`;
      console.log("sync_counts: fetching from", url);
      const res = await fetch(url, { headers: apiHeaders });
      const resText = await res.text();
      if (!res.ok) {
        return jsonResponse({ success: false, message: `Evolution API error ${res.status}` }, 400);
      }

      let apiGroups: any[];
      try { apiGroups = JSON.parse(resText); } catch { apiGroups = []; }
      if (!Array.isArray(apiGroups)) apiGroups = Object.values(apiGroups);

      // Get user's groups from DB
      const { data: dbGroups } = await adminClient
        .from("whatsapp_groups")
        .select("id, group_id, max_participants")
        .eq("user_id", userId);

      if (!dbGroups || dbGroups.length === 0) {
        return jsonResponse({ success: true, updated: 0, message: "Nenhum grupo no banco" });
      }

      // Build a map: group_id (JID) -> api size
      const sizeMap = new Map<string, number>();
      for (const ag of apiGroups) {
        const jid = ag.id || ag.jid;
        const size = ag.size ?? ag.participants?.length ?? 0;
        if (jid) sizeMap.set(jid, size);
      }

      let updated = 0;
      for (const dbg of dbGroups) {
        const size = sizeMap.get(dbg.group_id);
        if (size === undefined) continue;
        const maxP = dbg.max_participants || 1024;
        const isFull = size >= maxP;
        const { error } = await adminClient
          .from("whatsapp_groups")
          .update({ participant_count: size, is_full: isFull, updated_at: new Date().toISOString() })
          .eq("id", dbg.id);
        if (!error) updated++;
      }

      return jsonResponse({ success: true, updated, message: `${updated} grupo(s) atualizado(s)` });
    }

    // ===== CREATE GROUP =====
    if (action === "create") {
      const { name, admin_number, categories, is_flash_deals_only } = body;
      if (!name || !admin_number) {
        return jsonResponse({ error: "name e admin_number são obrigatórios" }, 400);
      }

      // Create group via Evolution API
      const createRes = await fetch(`${baseUrl}/group/create/${instanceName}`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ subject: name, participants: [admin_number] }),
      });
      const createText = await createRes.text();
      console.log("create group response:", createRes.status, createText.substring(0, 500));
      if (!createRes.ok) {
        return jsonResponse({ success: false, message: `Erro ao criar grupo: ${createText.substring(0, 200)}` }, 400);
      }

      let createData: any;
      try { createData = JSON.parse(createText); } catch { createData = {}; }
      const jid = createData?.id || createData?.jid || createData?.groupId || "";
      if (!jid) {
        return jsonResponse({ success: false, message: "Não foi possível obter o JID do grupo criado" }, 500);
      }

      // Get invite code
      let inviteLink = "";
      try {
        const inviteRes = await fetch(
          `${baseUrl}/group/inviteCode/${instanceName}?groupJid=${encodeURIComponent(jid)}`,
          { headers: apiHeaders }
        );
        const inviteData = await inviteRes.json();
        const code = inviteData?.inviteCode || inviteData?.code || "";
        if (code) inviteLink = `https://chat.whatsapp.com/${code}`;
      } catch (e) {
        console.log("Failed to get invite code:", (e as Error).message);
      }

      // Insert into DB
      const { data: inserted, error: insertError } = await adminClient
        .from("whatsapp_groups")
        .insert({
          user_id: userId,
          group_id: jid,
          group_name: name,
          categories: categories || [],
          is_flash_deals_only: is_flash_deals_only || false,
          invite_link: inviteLink || null,
          participant_count: 1,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        return jsonResponse({ success: false, message: insertError.message }, 500);
      }

      return jsonResponse({ success: true, group: inserted, message: "Grupo criado com sucesso!" });
    }

    return jsonResponse({ error: "Ação inválida. Use: sync_counts, create" }, 400);
  } catch (e) {
    console.error("manage-whatsapp-groups error:", e);
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
