import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      product_title, price, old_price, discount_percentage,
      rating, installments, price_type, original_url,
      system_prompt, mode,
      // Custom mode fields
      highlight_discount, highlight_installments,
      highlight_open_box, highlight_urgency, tone, is_buy_box,
      // Scarcity metadata
      target_time, percent_claimed,
    } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const discount = parseInt(discount_percentage ?? "0");
    const medal = getMedal(discount);
    const priceType = price_type === "PIX" ? "no Pix" : "à Vista";
    const formattedPrice = Number(price ?? 0).toFixed(2).replace(".", ",");

    // Choose prompt based on mode
    let chosenPrompt: string;
    if (system_prompt) {
      chosenPrompt = system_prompt;
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
    // original_url intentionally omitted to prevent AI from hallucinating links

    // Inject scarcity context into the prompt
    let scarcityInstruction = "";
    if (target_time || percent_claimed) {
      scarcityInstruction = `\n\nBLOCO DE URGÊNCIA OBRIGATÓRIO: Este produto é uma Oferta Relâmpago! Crie um parágrafo ISOLADO (separado por linhas em branco antes e depois) dedicado APENAS à escassez.`;
      if (target_time) scarcityInstruction += ` O tempo está a acabar (termina em: ${target_time}).`;
      if (percent_claimed) scarcityInstruction += ` Já há muitas unidades vendidas (${percent_claimed}).`;
      scarcityInstruction += ` Use emojis ⚡ ou ⏳. Exemplo: '⚡ OFERTA RELÂMPAGO: Já temos 84% vendido, corre que tá acabando!'. NUNCA misture este texto com a frase de humor do gancho.`;
    }

    // Append scarcity to chosen prompt
    chosenPrompt += scarcityInstruction;

    if (mode !== "custom") {
      userContent += `\n\nCrie a mensagem seguindo a estrutura indicada:`;
    } else {
      userContent += `\n\nCrie a mensagem promocional:`;
    }

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
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Settings > Workspace > Usage." }), {
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
      // Fallback
      console.warn("AI gateway unavailable, using fallback title");
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
