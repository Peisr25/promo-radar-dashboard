

# Auto-Categorizar Produtos da Shopee com IA

## Resumo
Criar uma Edge Function `auto-categorize` que usa IA para classificar produtos da Shopee com base no titulo, e adicionar um botao na UI do Pipeline para acionar essa categorizacao em lote.

## Alteracoes

### 1. Nova Edge Function: `supabase/functions/auto-categorize/index.ts`

- Recebe um array de objetos `{ id: number, product_title: string }`.
- Usa o Lovable AI Gateway (`google/gemini-3-flash-preview`) com `LOVABLE_API_KEY` (ja configurado).
- System prompt instrui a IA a classificar cada produto em UMA das categorias: Smartphones, Eletrodomesticos, TV e Video, Informatica, Eletroportateis, Casa e Moveis, Beleza e Perfumaria, Moda, Outros.
- Para eficiencia, envia todos os titulos num unico prompt em formato de lista numerada e pede resposta no mesmo formato (uma categoria por linha).
- Faz parse da resposta e executa UPDATE na tabela `raw_scrapes` para cada produto, atualizando `metadata` com a categoria via `jsonb_set` ou merge de JSONB.
- Usa `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (ambos ja configurados como secrets) para criar um client Supabase com permissoes de servico e contornar RLS.
- Trata erros 429/402 do gateway de IA.

### 2. Configuracao: `supabase/config.toml`

Adicionar entrada para a nova funcao:
```text
[functions.auto-categorize]
verify_jwt = false
```

### 3. UI: Botao na pagina Pipeline (`src/pages/Pipeline.tsx`)

- Adicionar estado `categorizing` (boolean) para controlar loading.
- Calcular `uncategorizedShopee`: produtos filtrados onde `source === "shopee"` e `metadata.categoria === "Shopee Geral"` (ou sem categoria).
- Renderizar botao "Auto-Categorizar (IA)" com icone Sparkles, visivel apenas quando `sourceFilter === "shopee"` ou `sourceFilter === "all"`, e habilitado apenas se `uncategorizedShopee.length > 0`.
- Ao clicar: exibir toast "Categorizando produtos...", chamar `supabase.functions.invoke("auto-categorize", { body: { products } })`, e apos sucesso fazer `fetchAll()` para atualizar a UI.
- Colocar o botao ao lado do botao "Apagar Todos" na aba "Novos Achados".

## Ficheiros alterados

| Ficheiro | Alteracao |
|---|---|
| `supabase/functions/auto-categorize/index.ts` | Novo ficheiro -- Edge Function de categorizacao em lote |
| `supabase/config.toml` | Adicionar `[functions.auto-categorize]` com `verify_jwt = false` |
| `src/pages/Pipeline.tsx` | Estado `categorizing`, calculo de produtos nao categorizados, botao com handler |

## Detalhes tecnicos da Edge Function

A estrategia de prompt em lote envia todos os titulos de uma vez para minimizar chamadas a IA:

```text
System: "Classifica cada produto numa das categorias: [lista]. Responde APENAS com o numero e a categoria, uma por linha. Ex: 1. Smartphones"
User: "1. Samsung Galaxy A15...\n2. Fritadeira Eletrica...\n3. ..."
```

O parse da resposta extrai linhas no formato `N. Categoria` e mapeia de volta aos IDs dos produtos. Categorias nao reconhecidas sao classificadas como "Outros".

O UPDATE usa o client Supabase com service role para fazer merge do campo `metadata`:
```typescript
await supabase.from("raw_scrapes").update({
  metadata: { ...existingMetadata, categoria: newCategory }
}).eq("id", productId);
```

