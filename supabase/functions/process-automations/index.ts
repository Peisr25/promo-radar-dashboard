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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
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
    const userId = claimsData.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Phase 1 — Fetch rules & pending scrapes
    const [rulesRes, scrapesRes] = await Promise.all([
      admin
        .from("automation_rules")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true),
      admin
        .from("raw_scrapes")
        .select("*")
        .eq("status", "pending"),
    ]);

    if (rulesRes.error) throw new Error("Erro ao buscar regras: " + rulesRes.error.message);
    if (scrapesRes.error) throw new Error("Erro ao buscar scrapes: " + scrapesRes.error.message);

    const rules = rulesRes.data ?? [];
    const scrapes = scrapesRes.data ?? [];

    if (rules.length === 0 || scrapes.length === 0) {
      return new Response(
        JSON.stringify({ processed: scrapes.length, sent: 0, errors: 0, skipped: scrapes.length, message: rules.length === 0 ? "Nenhuma regra ativa." : "Nenhum scrape pendente." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pre-fetch whatsapp group mappings (UUID -> real group_id)
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
      const metadata = (scrape.metadata as Record<string, unknown>) ?? {};
      const categoria = (metadata.categoria as string) ?? "";
      const discount = parseDiscount(scrape.discount_percentage);

      // Find first matching rule
      const matchedRule = rules.find(
        (rule) =>
          rule.categories.includes(categoria) && discount >= Number(rule.min_discount)
      );

      if (!matchedRule) {
        await admin.from("raw_scrapes").update({ status: "skipped" }).eq("id", scrape.id);
        skipped++;
        continue;
      }

      // Insert processing log
      const { data: logRow } = await admin.from("automation_logs").insert({
        rule_id: matchedRule.id,
        scrape_id: scrape.id,
        user_id: userId,
        status: "processing",
        message: `Processando via regra: ${matchedRule.name}`,
      }).select("id").single();
      const logId = logRow?.id;

      try {
        // Resolve real WhatsApp group_id
        const group = groupMap.get(matchedRule.target_group_id);
        if (!group) throw new Error("Grupo de destino não encontrado.");

        // Build generate-promo-message payload
        const generateBody: Record<string, unknown> = {
          product_title: scrape.product_title,
          price: scrape.price,
          old_price: scrape.old_price,
          discount_percentage: scrape.discount_percentage,
          rating: scrape.rating,
          installments: scrape.installments,
          price_type: scrape.price_type,
          original_url: scrape.original_url,
          is_buy_box: metadata.is_buy_box ?? false,
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
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(generateBody),
        });

        if (!genRes.ok) {
          const errText = await genRes.text();
          throw new Error(`Falha ao gerar copy (${genRes.status}): ${errText.substring(0, 200)}`);
        }

        const { message: promoText } = await genRes.json();
        if (!promoText) throw new Error("Copy vazia retornada pela IA.");

        // Call send-whatsapp-message
        const sendBody: Record<string, unknown> = {
          action: "send",
          group_id: group.group_id,
          text: promoText,
        };
        if (scrape.image_url) {
          sendBody.image_url = scrape.image_url;
        }

        const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-message`, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sendBody),
        });

        const sendData = await sendRes.json();
        if (!sendRes.ok || !sendData.success) {
          throw new Error(sendData.message ?? "Falha ao enviar para WhatsApp.");
        }

        // Success
        if (logId) {
          await admin.from("automation_logs").update({
            status: "success",
            message: `Enviado com sucesso para o grupo ${group.group_name}`,
          }).eq("id", logId);
        }

        await admin.from("raw_scrapes").update({ status: "published" }).eq("id", scrape.id);
        sent++;

        // Small delay between sends to avoid rate limiting
        await new Promise((r) => setTimeout(r, 2000));
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

    return new Response(
      JSON.stringify({ processed: scrapes.length, sent, errors, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("process-automations error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
