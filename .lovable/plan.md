

# Motor de Automacao (process-automations)

## Resumo

Criar a Edge Function `process-automations` que cruza scrapes pendentes com regras ativas, gera copy via IA e envia para WhatsApp automaticamente. Adicionar botao de gatilho manual na UI.

## Alteracoes

### 1. Edge Function `supabase/functions/process-automations/index.ts`

Logica principal:

1. **Auth**: Valida JWT do utilizador via header Authorization + `getClaims()`
2. **Fase 1 - Fetch**: Busca `automation_rules` ativas (filtradas por `user_id`) e `raw_scrapes` com `status = 'pending'`
3. **Fase 2 - Loop**: Para cada scrape pendente, testa contra todas as regras:
   - Match de categoria: `scrape.metadata.categoria` deve estar em `rule.categories`
   - Match de desconto: `discount_percentage` (limpo e convertido para numero) >= `rule.min_discount`
4. **Fase 3 - Execucao**: Quando ha match:
   - Insere log com `status = 'processing'`
   - Busca o `group_id` real da tabela `whatsapp_groups` usando `rule.target_group_id` (que e o UUID interno)
   - Chama `generate-promo-message` via fetch interno com dados do produto + `ai_mode` e `custom_ai_options` da regra
   - Chama `send-whatsapp-message` via fetch interno com `action: 'send'`, `group_id` (WhatsApp ID real) e texto gerado
   - Atualiza log para `status = 'success'`
   - Atualiza `raw_scrapes.status` para `'published'`
5. **Fase 4 - Sem Match/Erro**:
   - Erro durante processamento: atualiza log para `status = 'error'` com mensagem do erro
   - Scrape sem match com nenhuma regra: atualiza `status` para `'skipped'`

Detalhes de implementacao:
- Usa `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS nas operacoes de UPDATE/INSERT
- Chamadas a `generate-promo-message` e `send-whatsapp-message` sao feitas via fetch direto ao URL da funcao (usando `SUPABASE_URL`), passando o token do utilizador no header Authorization
- Para o modo `custom`, passa as opcoes de `custom_ai_options` (highlight_discount, highlight_installments, etc.) no body do generate
- Retorna um resumo com contagem de processados, enviados, erros e ignorados

### 2. Configuracao em `supabase/config.toml`

Adicionar:
```text
[functions.process-automations]
verify_jwt = false
```

### 3. Politica RLS adicional em `automation_logs`

A tabela `automation_logs` atualmente nao permite UPDATE. Como a Edge Function precisa atualizar logs de `processing` para `success`/`error`, sera necessaria uma migration para adicionar uma politica de UPDATE (ou usar o service role client que bypassa RLS - mais simples e ja e o que usamos).

Como usamos `SUPABASE_SERVICE_ROLE_KEY` na Edge Function, nao precisa de nova politica -- o service role ignora RLS.

### 4. Atualizacao da UI (`src/pages/Automations.tsx`)

- Adicionar import de `Play` e `Loader2` do lucide-react
- Adicionar um `useMutation` para invocar `process-automations` via `supabase.functions.invoke`
- Adicionar botao "Executar Motor Agora" no header, ao lado do botao "Nova Automacao"
- Loading state no botao enquanto executa
- Toast de sucesso/erro ao terminar
- Invalida a query `automation_logs` para forcar reload do Mini Log

### 5. Ficheiros a criar/editar

| Ficheiro | Acao |
|---|---|
| `supabase/functions/process-automations/index.ts` | Criar Edge Function |
| `supabase/config.toml` | Adicionar config verify_jwt = false |
| `src/pages/Automations.tsx` | Adicionar botao de gatilho manual |

### Fluxo de dados

```text
[Botao UI] --> POST process-automations (com JWT do user)
  |
  |--> Fetch regras ativas (user_id)
  |--> Fetch scrapes pendentes
  |
  |--> Para cada scrape:
  |     |--> Testar contra cada regra (categoria + desconto)
  |     |
  |     |--> MATCH:
  |     |     |--> Log (processing)
  |     |     |--> generate-promo-message (ai_mode + options)
  |     |     |--> send-whatsapp-message (group_id + texto)
  |     |     |--> Log (success) + scrape status = 'published'
  |     |
  |     |--> ERRO:
  |     |     |--> Log (error) + mensagem de erro
  |     |
  |     |--> SEM MATCH (nenhuma regra):
  |           |--> scrape status = 'skipped'
  |
  |--> Retorna resumo { processed, sent, errors, skipped }
```

