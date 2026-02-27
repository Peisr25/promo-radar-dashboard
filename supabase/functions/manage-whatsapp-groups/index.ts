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

function getNextGroupName(currentName: string): string {
  const regex = /(.*?)\s*#(\d+)$/;
  const match = currentName.match(regex);
  if (match) {
    const prefix = match[1];
    const next = parseInt(match[2], 10) + 1;
    const padded = next.toString().padStart(match[2].length, "0");
    return `${prefix} #${padded}`;
  }
  return `${currentName} #02`;
}

async function createOverflowGroup(
  adminClient: any,
  baseUrl: string,
  instanceName: string,
  apiHeaders: Record<string, string>,
  sourceGroup: any,
  userId: string,
): Promise<{ success: boolean; newName?: string; error?: string }> {
  const newName = getNextGroupName(sourceGroup.group_name);
  const adminNumber = Deno.env.get("ADMIN_WHATSAPP_NUMBER");
  if (!adminNumber) {
    return { success: false, error: "ADMIN_WHATSAPP_NUMBER not configured" };
  }

  // Anti-spam delay
  await new Promise((r) => setTimeout(r, 8000));

  // Create group via Evolution API
  const createRes = await fetch(`${baseUrl}/group/create/${instanceName}`, {
    method: "POST",
    headers: apiHeaders,
    body: JSON.stringify({ subject: newName, participants: [adminNumber] }),
  });
  const createText = await createRes.text();
  console.log(`overflow: create group "${newName}" response: ${createRes.status}`);
  if (!createRes.ok) {
    return { success: false, newName, error: `API error ${createRes.status}: ${createText.substring(0, 200)}` };
  }

  let createData: any;
  try { createData = JSON.parse(createText); } catch { createData = {}; }
  const jid = createData?.id || createData?.jid || createData?.groupId || "";
  if (!jid) {
    return { success: false, newName, error: "Could not get JID from created group" };
  }

  // Fetch invite link
  let inviteLink = "";
  try {
    const inviteRes = await fetch(
      `${baseUrl}/group/inviteCode/${instanceName}?groupJid=${encodeURIComponent(jid)}`,
      { headers: apiHeaders },
    );
    const inviteData = await inviteRes.json();
    const code = inviteData?.inviteCode || inviteData?.code || "";
    if (code) inviteLink = `https://chat.whatsapp.com/${code}`;
  } catch (e) {
    console.log("overflow: failed to get invite code:", (e as Error).message);
  }

  // Insert new group inheriting config from source
  const { error: insertError } = await adminClient
    .from("whatsapp_groups")
    .insert({
      user_id: userId,
      group_id: jid,
      group_name: newName,
      categories: sourceGroup.categories || [],
      is_flash_deals_only: sourceGroup.is_flash_deals_only || false,
      invite_link: inviteLink || null,
      participant_count: 1,
      is_full: false,
      is_active: true,
    });

  if (insertError) {
    return { success: false, newName, error: insertError.message };
  }

  console.log(`overflow: group "${newName}" created successfully (jid: ${jid})`);
  return { success: true, newName };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action } = body;

    // ===== CRON SYNC ALL =====
    if (action === "cron_sync_all") {
      console.log("cron_sync_all: starting global sync");

      const { data: configs, error: configsError } = await adminClient
        .from("evolution_config")
        .select("*")
        .eq("is_active", true);

      if (configsError || !configs) {
        console.error("cron_sync_all: failed to fetch configs", configsError);
        return jsonResponse({ success: false, message: "Failed to fetch configs" }, 500);
      }

      let totalUsersProcessed = 0;
      let totalGroupsUpdated = 0;
      let totalOverflows = 0;
      const overflowDetails: string[] = [];
      const errors: string[] = [];

      for (const config of configs) {
        try {
          const baseUrl = config.api_url.replace(/\/+$/, "");
          const instanceName = config.session_name;
          const apiHeaders = { apikey: config.api_key, "Content-Type": "application/json" };
          const userId = config.user_id;

          const url = `${baseUrl}/group/fetchAllGroups/${instanceName}?getParticipants=false`;
          const res = await fetch(url, { headers: apiHeaders });
          if (!res.ok) {
            errors.push(`User ${userId}: API error ${res.status}`);
            continue;
          }

          let apiGroups: any[];
          try { apiGroups = await res.json(); } catch { apiGroups = []; }
          if (!Array.isArray(apiGroups)) apiGroups = Object.values(apiGroups);

          const { data: dbGroups } = await adminClient
            .from("whatsapp_groups")
            .select("id, group_id, max_participants, group_name, categories, is_flash_deals_only, is_full")
            .eq("user_id", userId);

          if (!dbGroups || dbGroups.length === 0) {
            totalUsersProcessed++;
            continue;
          }

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

            // Overflow: group just became full
            if (isFull && !dbg.is_full) {
              console.log(`cron_sync_all: overflow detected for "${dbg.group_name}" (user ${userId})`);
              const result = await createOverflowGroup(adminClient, baseUrl, instanceName, apiHeaders, dbg, userId);
              if (result.success) {
                totalOverflows++;
                overflowDetails.push(result.newName!);
              } else {
                errors.push(`Overflow failed for "${dbg.group_name}": ${result.error}`);
              }
            }
          }

          totalGroupsUpdated += updated;
          totalUsersProcessed++;
          console.log(`cron_sync_all: user ${userId} - ${updated} groups updated`);
        } catch (e) {
          errors.push(`User ${config.user_id}: ${(e as Error).message}`);
        }
      }

      console.log(`cron_sync_all: done. Users: ${totalUsersProcessed}, Groups: ${totalGroupsUpdated}, Overflows: ${totalOverflows}, Errors: ${errors.length}`);
      return jsonResponse({
        success: true,
        users_processed: totalUsersProcessed,
        groups_updated: totalGroupsUpdated,
        overflows: totalOverflows,
        overflow_details: overflowDetails.length > 0 ? overflowDetails : undefined,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // === Auth required for all other actions ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return jsonResponse({ error: "Unauthorized" }, 401);
    const userId = claimsData.claims.sub as string;

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

      const { data: dbGroups } = await adminClient
        .from("whatsapp_groups")
        .select("id, group_id, max_participants, group_name, categories, is_flash_deals_only, is_full")
        .eq("user_id", userId);

      if (!dbGroups || dbGroups.length === 0) {
        return jsonResponse({ success: true, updated: 0, overflows: 0, message: "Nenhum grupo no banco" });
      }

      const sizeMap = new Map<string, number>();
      for (const ag of apiGroups) {
        const jid = ag.id || ag.jid;
        const size = ag.size ?? ag.participants?.length ?? 0;
        if (jid) sizeMap.set(jid, size);
      }

      let updated = 0;
      let overflows = 0;
      const overflowDetails: string[] = [];

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

        // Overflow: group just became full
        if (isFull && !dbg.is_full) {
          console.log(`sync_counts: overflow detected for "${dbg.group_name}"`);
          const result = await createOverflowGroup(adminClient, baseUrl, instanceName, apiHeaders, dbg, userId);
          if (result.success) {
            overflows++;
            overflowDetails.push(result.newName!);
          } else {
            console.error(`sync_counts: overflow failed for "${dbg.group_name}":`, result.error);
          }
        }
      }

      return jsonResponse({
        success: true,
        updated,
        overflows,
        overflow_details: overflowDetails.length > 0 ? overflowDetails : undefined,
        message: `${updated} grupo(s) atualizado(s), ${overflows} transbordo(s) criado(s)`,
      });
    }

    // ===== CREATE GROUP =====
    if (action === "create") {
      const { name, admin_number, categories, is_flash_deals_only } = body;
      if (!name || !admin_number) {
        return jsonResponse({ error: "name e admin_number são obrigatórios" }, 400);
      }

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

    return jsonResponse({ error: "Ação inválida. Use: sync_counts, create, cron_sync_all" }, 400);
  } catch (e) {
    console.error("manage-whatsapp-groups error:", e);
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
