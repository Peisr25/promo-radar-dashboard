import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_CATEGORIES = [
  "Smartphones",
  "Eletrodomésticos",
  "TV e Vídeo",
  "Informática",
  "Eletroportáteis",
  "Casa e Móveis",
  "Beleza e Perfumaria",
  "Moda",
  "Outros",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { products } = await req.json() as {
      products: { id: number; product_title: string }[];
    };

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum produto enviado." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build numbered list of titles
    const numberedList = products
      .map((p, i) => `${i + 1}. ${p.product_title}`)
      .join("\n");

    const systemPrompt = `Você é um assistente de e-commerce. Vou te enviar uma lista numerada de títulos de produtos. Para cada um, classifique em APENAS UMA das seguintes categorias: ${VALID_CATEGORIES.join(", ")}.

Responda APENAS com o número e a categoria correspondente, uma por linha. Exemplo:
1. Smartphones
2. Eletrodomésticos
3. Outros

Não adicione nenhum texto extra, explicação ou formatação adicional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: numberedList },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Parse response lines: "N. Category"
    const lines = aiText.split("\n").filter((l: string) => l.trim());
    const categoryMap = new Map<number, string>();

    for (const line of lines) {
      const match = line.match(/^(\d+)\.\s*(.+)$/);
      if (match) {
        const idx = parseInt(match[1]) - 1;
        const rawCat = match[2].trim();
        const category = VALID_CATEGORIES.find(
          (c) => c.toLowerCase() === rawCat.toLowerCase()
        ) ?? "Outros";
        categoryMap.set(idx, category);
      }
    }

    // Update database using service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let updated = 0;
    let errors = 0;

    for (let i = 0; i < products.length; i++) {
      const category = categoryMap.get(i) ?? "Outros";
      const product = products[i];

      // Fetch existing metadata to merge
      const { data: existing } = await supabase
        .from("raw_scrapes")
        .select("metadata")
        .eq("id", product.id)
        .single();

      const existingMeta = (existing?.metadata as Record<string, unknown>) ?? {};
      const newMeta: Record<string, unknown> = { ...existingMeta, categoria: category };
      // Also update amazon_category if it exists (Amazon products use this field for display)
      if (existingMeta.amazon_category !== undefined) {
        newMeta.amazon_category = category;
      }

      const { error } = await supabase
        .from("raw_scrapes")
        .update({ metadata: newMeta })
        .eq("id", product.id);

      if (error) {
        console.error(`Error updating product ${product.id}:`, error);
        errors++;
      } else {
        updated++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, updated, errors, total: products.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("auto-categorize error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
