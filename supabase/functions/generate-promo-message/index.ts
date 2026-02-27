import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getMedal(discount: number): string {
  if (discount >= 60) return "🥇";
  if (discount >= 40) return "🥈";
  return "🥉";
}

// --- Prompt builders ---

function buildDefaultPrompt(): string {
  return `Você atua no WhatsApp. É ESTRITAMENTE PROIBIDO usar introduções, saudações, bullet points, descrições de funcionalidades ou emojis não solicitados.

ESTRUTURA OBRIGATÓRIA (cada bloco separado por uma linha em branco):

BLOCO 1 - GANCHO: [Emoji de medalha baseado no desconto: 🥇 para >=60%, 🥈 para >=40%, 🥉 para o resto] [FRASE ENGRAÇADA, IRÔNICA E CURTA EM CAIXA ALTA]

BLOCO 2 - TÍTULO: [Nome original do produto em Title Case]

BLOCO 3 - URGÊNCIA (APENAS se indicado no contexto): Um parágrafo ISOLADO dedicado à escassez, usando emojis ⚡ ou ⏳. Se NÃO houver indicação de urgência, OMITA este bloco completamente.

BLOCO 4 - PREÇO: [Preço e parcelamento com formatação WhatsApp. Ex: ~R$ 199,90~ por *R$ 99,90* (*50% OFF*) no PIX]

REGRAS:
- Responda APENAS com a mensagem formatada, sem aspas, sem explicação.
- Humor brasileiro, memes e referências da cultura pop.
- Sem palavrões ou linguagem ofensiva.
- NÃO inclua links ou URLs na resposta. O link será adicionado automaticamente.
- MÁXIMO 5 linhas no total (excluindo linhas em branco de separação).
- Use formatação WhatsApp: ~texto~ para tachado (preço antigo) e *texto* para negrito (preço novo/desconto).
- NUNCA misture o texto de urgência/escassez no mesmo parágrafo da frase de humor do gancho. A urgência deve ser SEMPRE um bloco visual separado.`;
}

function buildCustomPrompt(options: {
  highlight_discount: boolean;
  highlight_installments: boolean;
  highlight_open_box: boolean;
  highlight_urgency: boolean;
  tone: string;
  discount_percentage?: string;
  installments?: string;
  is_buy_box?: boolean;
}): string {
  const toneMap: Record<string, string> = {
    funny: "Engraçado e descontraído, com humor brasileiro",
    direct: "Direto, profissional e focado em conversão",
    aggressive: "Agressivo e urgente, criando FOMO (medo de perder)",
  };

  const toneText = toneMap[options.tone] || toneMap.funny;

  let highlights = "";
  if (options.highlight_discount && options.discount_percentage) {
    highlights += `\n- Destaque que o produto está com ${options.discount_percentage}% de desconto.`;
  }
  if (options.highlight_installments && options.installments) {
    highlights += `\n- Destaque o parcelamento: ${options.installments}.`;
  }
  if (options.highlight_open_box && options.is_buy_box) {
    highlights += `\n- Alerte de forma positiva que é um produto reembalado/Open Box, garantindo que está em perfeito estado.`;
  }
  if (options.highlight_urgency) {
    highlights += `\n- Crie urgência mencionando que há poucas unidades disponíveis.`;
  }

  return `Escreva uma mensagem de WhatsApp para vender o produto abaixo.

${highlights ? `Destaques OBRIGATÓRIOS na mensagem:${highlights}` : ""}

O Tom de voz deve ser: ${toneText}.

ESTRUTURA OBRIGATÓRIA (cada bloco separado por uma linha em branco):

BLOCO 1 - GANCHO: Frase criativa chamando atenção, com emojis relevantes.

BLOCO 2 - TÍTULO: Nome do produto de forma limpa.

BLOCO 3 - URGÊNCIA (APENAS se indicado no contexto): Um parágrafo ISOLADO dedicado à escassez, usando emojis ⚡ ou ⏳. Se NÃO houver indicação de urgência, OMITA este bloco completamente.

BLOCO 4 - PREÇO: Bloco de preço com formatação WhatsApp (~antigo~ por *novo*).

REGRAS:
- Responda APENAS com a mensagem formatada, sem aspas, sem explicação.
- Sem palavrões ou linguagem ofensiva.
- NÃO inclua links ou URLs na resposta. O link será adicionado automaticamente.
- Use formatação WhatsApp: ~texto~ para tachado (preço antigo) e *texto* para negrito (preço novo/desconto).
- NUNCA misture o texto de urgência/escassez no mesmo parágrafo da frase de humor do gancho. A urgência deve ser SEMPRE um bloco visual separado.
- MÁXIMO 6 linhas (excluindo linhas em branco de separação). Nunca use formato de lista ou descrições longas.`;
}

function buildBroadcastPrompt(config: {
  tone: string;
  copy_length: string;
  emoji_level: string;
  show_installments: boolean;
}): string {
  const toneMap: Record<string, string> = {
    urgente: "Use um tom de URGÊNCIA e ESCASSEZ. Transmita que é uma oferta imperdível, que pode acabar a qualquer momento. Use palavras como 'CORRE', 'ACABOU DE BUGAR', 'PREÇO ERRADO'. Crie FOMO.",
    amigavel: "Use um tom AMIGÁVEL e DESCONTRAÍDO. Fale como se estivesse recomendando a um amigo. Use humor leve, memes e referências da cultura pop brasileira.",
    profissional: "Use um tom DIRETO e PROFISSIONAL. Vá direto ao ponto, sem rodeios. Foque nos dados concretos: preço, desconto, parcelamento. Sem exageros.",
  };

  const lengthMap: Record<string, string> = {
    curta: "MÁXIMO 4 linhas no total (excluindo linhas em branco de separação). Seja extremamente conciso e impactante.",
    detalhada: "MÁXIMO 8 linhas no total (excluindo linhas em branco de separação). Pode incluir especificações técnicas relevantes do produto.",
  };

  const emojiMap: Record<string, string> = {
    alta: "Use emojis LIVREMENTE ao longo do texto para dar destaque visual e energia.",
    moderada: "Use NO MÁXIMO 3 emojis em toda a mensagem, nos pontos mais estratégicos.",
    baixa: "Use NO MÁXIMO 1 emoji em toda a mensagem. A mensagem deve ser quase exclusivamente textual.",
  };

  const installmentRule = config.show_installments
    ? "Se houver informação de parcelamento nos dados do produto, DESTAQUE o parcelamento de forma clara no bloco de preço."
    : "NÃO mencione parcelamento na mensagem, mesmo que a informação esteja disponível.";

  return `Você é um copywriter especialista em WhatsApp para promoções brasileiras.

${toneMap[config.tone] || toneMap.urgente}

REGRAS DE FORMATO:
- ${lengthMap[config.copy_length] || lengthMap.curta}
- ${emojiMap[config.emoji_level] || emojiMap.alta}
- ${installmentRule}

ESTRUTURA OBRIGATÓRIA (cada bloco separado por uma linha em branco):

BLOCO 1 - GANCHO: Frase chamativa em CAIXA ALTA que capture atenção imediata.

BLOCO 2 - TÍTULO: Nome do produto em Title Case.

BLOCO 3 - URGÊNCIA (APENAS se indicado no contexto): Parágrafo ISOLADO de escassez. Se NÃO houver dados de urgência, OMITA completamente.

BLOCO 4 - PREÇO: Preço com formatação WhatsApp (~antigo~ por *novo* com *% OFF*).

REGRAS INVIOLÁVEIS:
- Responda APENAS com a mensagem formatada, sem aspas, sem explicação.
- NÃO inclua links ou URLs. O link será adicionado automaticamente.
- Use formatação WhatsApp: ~texto~ para tachado e *texto* para negrito.
- NUNCA misture urgência com o gancho. Urgência é SEMPRE um bloco separado.
- Termine com uma Call-to-Action curta convidando à compra.`;
}

// --- Main handler ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    let {
      product_title, price, old_price, discount_percentage,
      rating, installments, price_type, original_url,
      system_prompt, mode,
      highlight_discount, highlight_installments,
      highlight_open_box, highlight_urgency, tone, is_buy_box,
      target_time, percent_claimed,
      raw_scrape_id,
      source, metadata,
      message_config,
    } = body;

    const isEmpty = (v: unknown) => !v || v === "" || v === "null" || v === "undefined";

    // Server-side scarcity lookup
    if (isEmpty(target_time) && isEmpty(percent_claimed) && raw_scrape_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseKey) {
        const sb = createClient(supabaseUrl, supabaseKey);
        const { data: rawData } = await sb
          .from("raw_scrapes")
          .select("metadata")
          .eq("id", Number(raw_scrape_id))
          .maybeSingle();
        if (rawData?.metadata) {
          const meta = rawData.metadata as Record<string, unknown>;
          if (!isEmpty(meta.target_time)) target_time = String(meta.target_time);
          if (!isEmpty(meta.percent_claimed)) percent_claimed = String(meta.percent_claimed);
          console.log("Scarcity data recovered from DB:", { target_time, percent_claimed, source: "db_lookup" });
        }
      }
    } else if (!isEmpty(target_time) || !isEmpty(percent_claimed)) {
      console.log("Scarcity data from payload:", { target_time, percent_claimed, source: "payload" });
    }

    // Shein social proof
    let socialProofInstruction = "";
    let socialProofUserContext = "";
    const meta = metadata as Record<string, unknown> | null;
    if (source === "shein" && meta) {
      const rankInfo = meta.rank_info as string | undefined;
      const sheinRating = parseFloat(String(meta.shein_rating ?? "0"));
      const sheinReviews = meta.shein_reviews as string | undefined;

      if (rankInfo || sheinRating >= 4.8) {
        socialProofInstruction = `\n\n⚠️ PROVA SOCIAL OBRIGATÓRIA: Este produto é um sucesso de vendas na Shein.`;
        if (rankInfo) socialProofInstruction += ` O metadata indica que ele é: ${rankInfo}.`;
        if (sheinRating > 0) socialProofInstruction += ` Possui uma nota de ${sheinRating}`;
        if (sheinReviews) socialProofInstruction += ` com ${sheinReviews} avaliações`;
        socialProofInstruction += `. Inclua no texto promocional um gatilho de aprovação popular forte.`;

        socialProofUserContext = `\n\n🏆 PROVA SOCIAL SHEIN:`;
        if (rankInfo) socialProofUserContext += `\n- Ranking: ${rankInfo}`;
        if (sheinRating > 0) socialProofUserContext += `\n- Nota: ${sheinRating}`;
        if (sheinReviews) socialProofUserContext += `\n- Avaliações: ${sheinReviews}`;
        console.log("Shein social proof injected:", { rankInfo, sheinRating, sheinReviews });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const discount = parseInt(discount_percentage ?? "0");
    const medal = getMedal(discount);
    const priceType = price_type === "PIX" ? "no Pix" : "à Vista";
    const formattedPrice = Number(price ?? 0).toFixed(2).replace(".", ",");

    // Choose prompt based on mode / message_config
    let chosenPrompt: string;
    if (system_prompt) {
      chosenPrompt = system_prompt;
    } else if (message_config && typeof message_config === "object") {
      // Broadcast mode with message_config
      const mc = message_config as Record<string, unknown>;
      chosenPrompt = buildBroadcastPrompt({
        tone: (mc.tone as string) ?? "urgente",
        copy_length: (mc.copy_length as string) ?? "curta",
        emoji_level: (mc.emoji_level as string) ?? "alta",
        show_installments: mc.show_installments !== false,
      });
      console.log("Using broadcast prompt with message_config:", mc);
    } else if (mode === "custom") {
      chosenPrompt = buildCustomPrompt({
        highlight_discount: !!highlight_discount,
        highlight_installments: !!highlight_installments,
        highlight_open_box: !!highlight_open_box,
        highlight_urgency: !!highlight_urgency,
        tone: tone ?? "funny",
        discount_percentage,
        installments,
        is_buy_box: !!is_buy_box,
      });
    } else {
      chosenPrompt = buildDefaultPrompt();
    }

    // Build user message
    let userContent = `Produto: ${product_title}\nPreço: R$ ${formattedPrice}`;
    if (old_price && discount > 0) {
      userContent += `\nPreço antigo: R$ ${Number(old_price).toFixed(2).replace(".", ",")}`;
      userContent += `\nDesconto: ${discount}%`;
    }
    if (installments) userContent += `\nParcelamento: ${installments}`;
    if (price_type) userContent += `\nTipo de pagamento: ${price_type}`;
    if (rating) userContent += `\nAvaliação: ${rating}`;

    // Scarcity injection
    let scarcityInstruction = "";
    let scarcityUserContext = "";
    if (target_time || percent_claimed) {
      scarcityInstruction = `\n\n⚠️ REGRA INVIOLÁVEL - BLOCO DE URGÊNCIA: Este produto é uma Oferta Relâmpago. Você DEVE OBRIGATORIAMENTE incluir o BLOCO 3 (URGÊNCIA) na sua resposta. Este bloco é OBRIGATÓRIO e NÃO PODE ser omitido em NENHUMA circunstância. Crie um parágrafo ISOLADO (separado por linhas em branco antes e depois) dedicado APENAS à escassez.`;
      if (target_time) scarcityInstruction += ` O tempo está a acabar (termina em: ${target_time}).`;
      if (percent_claimed) scarcityInstruction += ` Já há muitas unidades vendidas (${percent_claimed}).`;
      scarcityInstruction += ` Use emojis ⚡ ou ⏳. NUNCA misture este texto com a frase de humor do gancho.`;

      scarcityUserContext = `\n\n🔴 OFERTA RELÂMPAGO - DADOS DE ESCASSEZ:`;
      if (percent_claimed) scarcityUserContext += `\n- Unidades vendidas: ${percent_claimed}`;
      if (target_time) scarcityUserContext += `\n- Termina em: ${target_time}`;
      scarcityUserContext += `\nINCLUA OBRIGATORIAMENTE um parágrafo isolado de urgência com estes dados na mensagem.`;
    }

    chosenPrompt += scarcityInstruction;
    chosenPrompt += socialProofInstruction;
    userContent += scarcityUserContext;
    userContent += socialProofUserContext;
    userContent += `\n\nCrie a mensagem promocional:`;

    // Retry up to 2 times on 5xx errors
    let response: Response | null = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: chosenPrompt },
            { role: "user", content: userContent },
          ],
        }),
      });

      if (response.ok) break;

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const t = await response.text();
      console.error(`AI gateway error (attempt ${attempt}):`, response.status, t);
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    if (!response || !response.ok) {
      console.warn("AI gateway unavailable, using fallback");
      const fallbackTitle = "PROMOÇÃO IMPERDÍVEL";
      const formatBRL = (v: number) => v.toFixed(2).replace(".", ",");
      let message = `${medal} ${fallbackTitle}\n\n`;
      message += `${product_title}\n\n`;
      if (old_price && discount > 0) {
        message += `🎟 ~R$ ${formatBRL(Number(old_price))}~ por R$ ${formatBRL(Number(price))} (*${discount}% OFF*)${priceType ? ` ${priceType}` : ''}\n\n`;
      } else {
        message += `💰 R$ ${formattedPrice} ${priceType}\n\n`;
      }
      if (original_url) message += original_url;
      return new Response(JSON.stringify({ message, fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content?.trim() ?? "PROMOÇÃO IMPERDÍVEL";
    const message = original_url ? `${aiText}\n\n${original_url}` : aiText;

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-promo-message error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
