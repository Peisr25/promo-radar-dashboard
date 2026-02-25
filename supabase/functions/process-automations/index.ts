import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseDiscount(raw: string | null): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^0-9.,]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function generateShortCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  let userId: string | null = null;

  try {
    // Auth
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = claimsData.claims.sub as string;

    // Upsert motor_control to is_running = true
    const { data: existingCtrl } = await admin
      .from("motor_control")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingCtrl) {
      await admin.from("motor_control").update({ is_running: true, updated_at: new Date().toISOString() }).eq("user_id", userId);
    } else {
      await admin.from("motor_control").insert({ user_id: userId, is_running: true });
    }

    // Phase 1 — Fetch rules & pending scrapes
    const [rulesRes, scrapesRes] = await Promise.all([
      admin.from("automation_rules").select("*").eq("user_id", userId).eq("is_active", true),
      admin.from("raw_scrapes").select("*").eq("status", "pending"),
    ]);

    if (rulesRes.error) throw new Error("Erro ao buscar regras: " + rulesRes.error.message);
    if (scrapesRes.error) throw new Error("Erro ao buscar scrapes: " + scrapesRes.error.message);

    const rules = rulesRes.data ?? [];
    const scrapes = scrapesRes.data ?? [];

    if (rules.length === 0 || scrapes.length === 0) {
      await admin.from("motor_control").update({ is_running: false, updated_at: new Date().toISOString() }).eq("user_id", userId);
      return new Response(
        JSON.stringify({ processed: scrapes.length, sent: 0, errors: 0, skipped: scrapes.length, message: rules.length === 0 ? "Nenhuma regra ativa." : "Nenhum scrape pendente." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pre-fetch whatsapp group mappings
    const groupUuids = [...new Set(rules.map((r) => r.target_group_id))];
    const { data: groupRows } = await admin
      .from("whatsapp_groups")
      .select("id, group_id, group_name")
      .in("id", groupUuids);
    const groupMap = new Map((groupRows ?? []).map((g) => [g.id, g]));

    let sent = 0;
    let errors = 0;
    let skipped = 0;

    // Phase 2 & 3 — Match & Execute
    for (const scrape of scrapes) {
      // Kill switch check
      const { data: ctrl } = await admin
        .from("motor_control")
        .select("is_running")
        .eq("user_id", userId)
        .single();

      if (ctrl && !ctrl.is_running) {
        await admin.from("automation_logs").insert({
          user_id: userId,
          status: "skipped",
          message: "Motor pausado pelo utilizador.",
        });
        break;
      }

      const metadata = (scrape.metadata as Record<string, unknown>) ?? {};
      const categoria = (metadata.categoria as string) ?? "";
      const discount = parseDiscount(scrape.discount_percentage);
      const title = scrape.product_title ?? "Sem título";

      // Find first matching rule
      const matchedRule = rules.find(
        (rule) => rule.categories.includes(categoria) && discount >= Number(rule.min_discount)
      );

      if (!matchedRule) {
        await admin.from("raw_scrapes").update({ status: "skipped" }).eq("id", scrape.id);
        skipped++;
        continue;
      }

      // Descriptive processing log
      const { data: logRow } = await admin.from("automation_logs").insert({
        rule_id: matchedRule.id,
        scrape_id: scrape.id,
        user_id: userId,
        status: "processing",
        message: `Processando: ${title.substring(0, 50)}... (Desc: ${discount}%)`,
      }).select("id").single();
      const logId = logRow?.id;

      try {
        const group = groupMap.get(matchedRule.target_group_id);
        if (!group) throw new Error("Grupo de destino não encontrado.");

        // Build generate-promo-message payload (WITHOUT original_url)
        const generateBody: Record<string, unknown> = {
          product_title: scrape.product_title,
          price: scrape.price,
          old_price: scrape.old_price,
          discount_percentage: scrape.discount_percentage,
          rating: scrape.rating,
          installments: scrape.installments,
          price_type: scrape.price_type,
          is_buy_box: metadata.is_buy_box ?? false,
          // original_url intentionally omitted
        };

        if (matchedRule.ai_mode === "custom" && matchedRule.custom_ai_options) {
          generateBody.mode = "custom";
          const opts = matchedRule.custom_ai_options as Record<string, unknown>;
          generateBody.highlight_discount = opts.highlight_discount ?? false;
          generateBody.highlight_installments = opts.highlight_installments ?? false;
          generateBody.highlight_open_box = opts.highlight_open_box ?? false;
          generateBody.highlight_urgency = opts.highlight_urgency ?? false;
          generateBody.tone = opts.tone ?? "funny";
        }

        // Call generate-promo-message
        const genRes = await fetch(`${supabaseUrl}/functions/v1/generate-promo-message`, {
          method: "POST",
          headers: { Authorization: authHeader, "Content-Type": "application/json" },
          body: JSON.stringify(generateBody),
        });

        if (!genRes.ok) {
          const errText = await genRes.text();
          throw new Error(`Falha ao gerar copy (${genRes.status}): ${errText.substring(0, 200)}`);
        }

        const { message: aiText } = await genRes.json();
        if (!aiText) throw new Error("Copy vazia retornada pela IA.");

        // Generate/fetch short link
        let shortUrl = "";
        if (scrape.original_url) {
          const { data: existing } = await admin
            .from("short_links")
            .select("short_code")
            .eq("original_url", scrape.original_url)
            .maybeSingle();

          if (existing) {
            shortUrl = `https://radardaspromos.lovable.app/r/${existing.short_code}`;
          } else {
            const shortCode = generateShortCode();
            await admin.from("short_links").insert({
              user_id: userId,
              original_url: scrape.original_url,
              short_code: shortCode,
              product_title: scrape.product_title,
              source: "automation",
            });
            shortUrl = `https://radardaspromos.lovable.app/r/${shortCode}`;
          }
        }

        // Concatenate AI text + short link
        const finalMessage = shortUrl ? `${aiText}\n\n${shortUrl}` : aiText;

        // Send to WhatsApp
        const sendBody: Record<string, unknown> = {
          action: "send",
          group_id: group.group_id,
          text: finalMessage,
        };
        if (scrape.image_url) {
          sendBody.image_url = scrape.image_url;
        }

        const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-message`, {
          method: "POST",
          headers: { Authorization: authHeader, "Content-Type": "application/json" },
          body: JSON.stringify(sendBody),
        });

        const sendData = await sendRes.json();
        if (!sendRes.ok || !sendData.success) {
          throw new Error(sendData.message ?? "Falha ao enviar para WhatsApp.");
        }

        // Success — update log
        if (logId) {
          await admin.from("automation_logs").update({
            status: "success",
            message: `Enviado: ${title.substring(0, 40)} -> ${group.group_name}`,
          }).eq("id", logId);
        }

        await admin.from("raw_scrapes").update({ status: "published" }).eq("id", scrape.id);

        // Increment group messages stats
        await admin.rpc("increment_group_messages", { group_id_param: matchedRule.target_group_id });

        // Insert into whatsapp_messages_log for dashboard metrics
        await admin.from("whatsapp_messages_log").insert({
          user_id: userId,
          group_id: matchedRule.target_group_id,
          message_text: finalMessage,
          status: "sent",
        });

        sent++;

        // Anti-spam delay: 8 seconds between sends
        await new Promise((r) => setTimeout(r, 8000));
      } catch (e) {
        errors++;
        const errorMsg = e instanceof Error ? e.message : "Erro desconhecido";
        console.error(`Error processing scrape ${scrape.id}:`, errorMsg);

        if (logId) {
          await admin.from("automation_logs").update({
            status: "error",
            message: errorMsg,
          }).eq("id", logId);
        }
      }
    }

    // Motor finished — set is_running = false
    await admin.from("motor_control").update({ is_running: false, updated_at: new Date().toISOString() }).eq("user_id", userId);

    return new Response(
      JSON.stringify({ processed: scrapes.length, sent, errors, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("process-automations error:", e);
    // Ensure motor is stopped on crash
    if (userId) {
      await admin.from("motor_control").update({ is_running: false, updated_at: new Date().toISOString() }).eq("user_id", userId).catch(() => {});
    }
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
