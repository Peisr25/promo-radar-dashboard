
Objetivo: corrigir de forma definitiva o “Regerar” da aba Revisão para que a linha de escassez (Oferta Relâmpago) apareça sempre quando existir no produto, sem depender de fetch extra no frontend.

Diagnóstico confirmado (com base no código e requests):
1) O request de “Regerar” na Revisão chega à função de IA sem `target_time`/`percent_claimed` em vários casos.
2) A estratégia atual tenta buscar metadata no frontend por `p.raw_scrape_id`, mas:
   - `promotions.raw_scrape_id` está como `uuid` no banco.
   - `raw_scrapes.id` é `bigint`.
   - No `processPromotion`, o insert em `promotions` nem grava `raw_scrape_id` hoje.
   Resultado: `raw_scrape_id` fica nulo, o fetch de metadata no frontend falha, e a IA perde escassez no Regerar.

Implementação proposta (arquitetura robusta):

1) Ajuste de banco (Lovable Cloud migration) para alinhar IDs
- Alterar `promotions.raw_scrape_id` para armazenar o ID real de `raw_scrapes` (`bigint`), com FK para `raw_scrapes(id)`.
- Estratégia segura de migração (sem cast quebrado de uuid):
  - criar coluna temporária bigint,
  - migrar/normalizar dados possíveis,
  - substituir coluna antiga por nova,
  - recriar FK e índice.
- Opcional de compatibilidade: tentar backfill em promoções já existentes por `product_url -> raw_scrapes.original_url` (mais recente), para resolver itens antigos já na revisão.

2) Frontend: enviar sempre referência do scrape original
Arquivo: `src/pages/Pipeline.tsx`
- Em `processPromotion(scrape)`, passar `raw_scrape_id: scrape.id` no insert em `promotions`.
- No botão “Regenerar” (aba revisão):
  - remover a query extra de metadata no frontend (não será mais necessário),
  - enviar no payload para geração:
    - `raw_scrape_id` (da promoção),
    - campos atuais (produto/preço/link curto etc.).
- No fluxo “Gerar Copy” da revisão:
  - manter envio de metadata quando já existir,
  - incluir também `raw_scrape_id` no `copyModalProduct` para fallback server-side.

3) Edge Function: recuperação server-side da escassez
Arquivo: `supabase/functions/generate-promo-message/index.ts`
- Adicionar suporte no body para:
  - `raw_scrape_id` (novo),
  - opcionalmente `amazon_category` recuperada do metadata.
- Logo no início:
  - se `target_time` e `percent_claimed` vierem vazios, mas houver `raw_scrape_id`,
  - a própria função consulta `raw_scrapes` e lê:
    - `metadata->target_time`
    - `metadata->percent_claimed`
    - `metadata->amazon_category`
- Usar os valores recuperados na mesma lógica de escassez já existente (`scarcityInstruction` + `scarcityUserContext`) antes da chamada ao modelo.
- Normalização:
  - tratar `null`, `""`, `"null"` como vazio.
- Observabilidade:
  - logs leves informando origem dos dados de escassez (`payload` vs `db_lookup`) para debug.

4) Compatibilidade e resiliência
- Se `raw_scrape_id` estiver ausente (promoções antigas), manter comportamento atual.
- (Opcional recomendado) fallback secundário por `original_url` quando possível para melhorar recuperação histórica sem intervenção manual.
- Não alterar estrutura de resposta da função (continua retornando `message`).

5) Plano de validação (fim-a-fim)
- Caso A: Novo item processado no Pipeline -> Revisão -> Regerar:
  - confirmar payload com `raw_scrape_id`,
  - confirmar retorno com bloco “⚡ OFERTA RELÂMPAGO...”.
- Caso B: Item antigo na Revisão:
  - validar backfill/fallback e presença da urgência.
- Caso C: Produto sem escassez:
  - confirmar que bloco de urgência não aparece.
- Caso D: Modo custom:
  - confirmar que regras de separação visual permanecem.

Arquivos impactados:
- `src/pages/Pipeline.tsx`
- `src/components/pipeline/GenerateCopyModal.tsx`
- `supabase/functions/generate-promo-message/index.ts`
- `supabase/migrations/*` (nova migration para corrigir tipo/relacionamento de `promotions.raw_scrape_id`)

Riscos e mitigação:
- Risco: mudança de tipo em coluna existente.
  - Mitigação: migração por coluna temporária + rename + validação pós-migração.
- Risco: promoções antigas sem vínculo.
  - Mitigação: backfill por URL e fallback defensivo na função.

Resultado esperado:
- A urgência passa a ser recuperada diretamente da fonte de dados no backend quando faltar no payload.
- O botão “Regerar” da Revisão deixa de depender de fetch frontend frágil.
- A frase de Oferta Relâmpago volta a aparecer consistentemente para produtos com tag de escassez.
