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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_title, price, old_price, discount_percentage, rating, installments, price_type, original_url, system_prompt } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const discount = parseInt(discount_percentage ?? "0");
    const medal = getMedal(discount);
    const priceType = price_type === "PIX" ? "no Pix" : "à Vista";
    const formattedPrice = Number(price ?? 0).toFixed(2).replace(".", ",");

    const defaultPrompt = `Você é um copywriter especializado em criar títulos engraçados e criativos para promoções de produtos em grupos de WhatsApp/Telegram brasileiros.

REGRAS OBRIGATÓRIAS:
- Máximo 8 palavras
- TUDO EM CAPS LOCK
- Humor brasileiro, memes e referências da cultura pop
- Relacionado ao benefício ou característica do produto
- Sem palavrões ou linguagem ofensiva
- Seja criativo e original
- Responda APENAS com o título, sem aspas, sem explicação

ESTRATÉGIAS DE HUMOR:
1. Comparação absurda: "O SEU DO CAMELÔ NÃO AGUENTA MAIS"
2. Referências nostálgicas: "SÓ PERDE PRA MOCHILA DO BEN 10"
3. Problema/solução: "IMPOSSIVEL ERRAR O ARROZ COM UMA DESSA"
4. Exagero cômico: "TÃO BARATO QUE DÁ MEDO"
5. Memes: "STONKS 📈", "É HOJE QUE O PATRÃO CHORA"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system_prompt || defaultPrompt },
          {
            role: "user",
            content: `Produto: ${product_title}\nDesconto: ${discount}%\nPreço: R$ ${formattedPrice}\nAvaliação: ${rating ?? "N/A"}\n\nCrie UM título criativo em CAPS LOCK (máximo 8 palavras):`,
          },
        ],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
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
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const creativeTitle = (data.choices?.[0]?.message?.content?.trim().toUpperCase() ?? "PROMOÇÃO IMPERDÍVEL");

    // Build the full message
    const formatBRL = (v: number) => v.toFixed(2).replace(".", ",");

    let message = `${medal} ${creativeTitle}\n`;
    message += `${product_title}\n`;
    if (old_price && discount > 0) {
      message += `🎟 ~R$ ${formatBRL(Number(old_price))}~ por R$ ${formatBRL(Number(price))} (${discount}% OFF)${priceType ? ` ${priceType}` : ''}\n`;
    } else {
      message += `💰 R$ ${formattedPrice} ${priceType}\n`;
    }
    if (original_url) {
      message += original_url;
    }

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
