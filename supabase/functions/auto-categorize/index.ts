import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_CATEGORIES = [
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

// Capitalize words, but keep small words (e, de, da, do) lowercase, EXCEPT TV
const titleCase = (s: string) => {
  const smallWords = ["e", "de", "da", "do", "das", "dos", "para", "com"];

  return s
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      // Exceção especial para "TV" (sempre maiúsculo)
      if (word === "tv") return "TV";

      // Se for uma palavra de ligação e não for a primeira palavra, mantém minúscula
      if (smallWords.includes(word) && index !== 0) {
        return word;
      }
      // Caso contrário, capitaliza a primeira letra
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { products } = (await req.json()) as {
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

    // Instancia o Supabase no início para podermos ler as categorias existentes
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Busca os últimos 2000 produtos para descobrir quais categorias já existem no banco
    const { data: recentScrapes } = await supabase
      .from("raw_scrapes")
      .select("metadata")
      .order("created_at", { ascending: false })
      .limit(2000);

    // 2. Cria um Set (lista sem repetições) unindo as BASE_CATEGORIES com as do banco
    const dynamicCategories = new Set<string>(BASE_CATEGORIES);
    recentScrapes?.forEach((row) => {
      const meta = row.metadata as Record<string, unknown> | null;
      if (meta && typeof meta.categoria === "string" && meta.categoria.trim() !== "") {
        dynamicCategories.add(titleCase(meta.categoria.trim()));
      }
    });

    const existingCategoriesList = Array.from(dynamicCategories).join(", ");

    // Build numbered list of titles
    const numberedList = products.map((p, i) => `${i + 1}. ${p.product_title}`).join("\n");

    // PROMPT ATUALIZADO: Mais rigoroso e alimentado com o banco de dados em tempo real
    const systemPrompt = `Você é um assistente de e-commerce. Vou te enviar uma lista numerada de títulos de produtos. Para cada um, classifique-o em uma categoria de e-commerce adequada.

CATEGORIAS JÁ EXISTENTES NO SISTEMA:
${existingCategoriesList}

REGRAS OBRIGATÓRIAS:
1. PRIORIDADE MÁXIMA: Tente sempre encaixar o produto em uma das categorias já existentes na lista acima.
2. NÃO CRIE variações de plural/singular (ex: se já existe "Bebê", não crie "Bebês").
3. NÃO CRIE sinônimos (ex: se já existe "Casa e Móveis", não crie "Casa e Construção").
4. Crie uma categoria NOVA apenas se o produto for completamente diferente de tudo que já existe (máximo de 3 palavras).

Responda APENAS com o número e a categoria correspondente, uma por linha. Exemplo:
1. Smartphones
2. Casa e Móveis
3. Ferramentas`;

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
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente." }), {
          status: 429,
          headers: corsHeaders,
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: corsHeaders,
        });
      }
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
        const category = rawCat.length > 0 ? titleCase(rawCat) : "Outros";
        categoryMap.set(idx, category);
      }
    }

    let updated = 0;
    let errors = 0;

    for (let i = 0; i < products.length; i++) {
      const category = categoryMap.get(i) ?? "Outros";
      const product = products[i];

      const { data: existing } = await supabase.from("raw_scrapes").select("metadata").eq("id", product.id).single();

      const existingMeta = (existing?.metadata as Record<string, unknown>) ?? {};
      const newMeta: Record<string, unknown> = { ...existingMeta, categoria: category };

      if (existingMeta.amazon_category !== undefined) {
        newMeta.amazon_category = category;
      }

      const { error } = await supabase.from("raw_scrapes").update({ metadata: newMeta }).eq("id", product.id);

      if (error) {
        console.error(`Error updating product ${product.id}:`, error);
        errors++;
      } else {
        updated++;
      }
    }

    return new Response(JSON.stringify({ success: true, updated, errors, total: products.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-categorize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
