

## Integrar Shein no Dashboard

### 1. Página Sources - Card Shein

Adicionar um novo Card para a Shein entre o card Amazon e o card Shopee, com estilo escuro (bg-zinc-900 text-white). O botao "Sincronizar" enviara o payload `{ site_name: "shein", source_id: "shein_api_source" }` para a edge function `start-scrape`, seguindo o mesmo padrao do card Amazon.

**Ficheiro:** `src/pages/Sources.tsx`
- Adicionar estado `sheinSyncing`
- Adicionar Card com fundo escuro (`className="bg-zinc-900 text-white border-zinc-800"`)
- Botao Sincronizar com a mesma logica do Amazon mas com payload Shein

### 2. Pipeline - Filtro de Fonte Shein

Adicionar a tab "Shein" aos filtros de fonte no topo do Pipeline.

**Ficheiro:** `src/pages/Pipeline.tsx`

- Linha 81: Expandir o tipo do `sourceFilter` para incluir `"shein"`
- Linha 401-414: Adicionar nova `TabsTrigger` para Shein com emoji preto/escuro
- Linha 469-481: Adicionar bloco de Badge para `s.source === "shein"` com estilo escuro (`bg-zinc-900 text-white border-zinc-700`)

### 3. Pipeline - Badges de Prova Social Shein nos Cards

Quando um produto for da Shein e possuir metadados especificos, mostrar badges adicionais.

**Ficheiro:** `src/pages/Pipeline.tsx` (dentro do bloco de renderizacao dos cards, apos linha 489)

- Se `s.metadata?.rank_info` existir: mostrar Badge dourado (`bg-amber-500/20 text-amber-400 border-amber-500/30`) com o texto do ranking (ex: "🏆 #3 Mais Vendido em Calcados")
- Se `s.metadata?.shein_rating` existir: mostrar a nota inline (ex: "star 4.9") junto com `shein_reviews` se disponivel

### 4. Edge Function - Injecao de Prova Social

Atualizar a edge function `generate-promo-message` para injetar contexto de prova social quando o produto for da Shein.

**Ficheiro:** `supabase/functions/generate-promo-message/index.ts`

Apos o bloco de recuperacao de escassez (linha ~130), adicionar logica:
- Verificar se `source === "shein"` no payload (adicionar campo `source` ao body)
- Se existir `metadata.rank_info` ou `metadata.shein_rating >= 4.8`, construir uma instrucao de prova social
- Injetar no prompt e no user content, seguindo o mesmo padrao da instrucao de escassez

Texto da instrucao:
```text
Este produto e um sucesso de vendas na Shein. O metadata indica que ele e: {rank_info} e possui uma nota de {shein_rating} com {shein_reviews} avaliacoes. Inclua no texto promocional um gatilho de aprovacao popular forte (ex: "Selo de Mais Vendido", "Quase 5 estrelas em milhares de avaliacoes!").
```

### 5. Pipeline - Passar source na chamada de IA

Para que a edge function saiba que o produto e da Shein, passar o campo `source` e os metadados relevantes na chamada `generateMessage` / `processPromotion`.

**Ficheiro:** `src/pages/Pipeline.tsx` (funcao `processPromotion`, linha ~297)
- Adicionar `source: scrape.source` ao payload
- Adicionar `metadata: scrape.metadata` ao payload para que a edge function possa ler `rank_info`, `shein_rating`, `shein_reviews`

**Ficheiro:** `supabase/functions/generate-promo-message/index.ts`
- Extrair `source` e `metadata` do body
- Usar estes campos na logica de prova social

### Resumo de ficheiros afetados

| Ficheiro | Alteracao |
|---|---|
| `src/pages/Sources.tsx` | Card Shein com sync |
| `src/pages/Pipeline.tsx` | Tab Shein, badge fonte, badges prova social, payload IA |
| `supabase/functions/generate-promo-message/index.ts` | Injecao de prova social Shein |

