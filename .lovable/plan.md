

## Limpeza: Remover Edge Function Obsoleta e Documentar Arquitetura Railway

### Contexto

O frontend ja chama o Railway corretamente via `fetch()` em `Automations.tsx` (linha 141-150). No entanto, a Edge Function `process-automations/index.ts` (573 linhas) ainda existe no projeto, o que pode causar confusao ou uso acidental.

### Alteracoes

#### 1. Eliminar a Edge Function `process-automations`

Apagar o diretorio `supabase/functions/process-automations/` e usar a ferramenta de delete para remover a funcao deployada do backend. Esta funcao ja nao e usada -- todo o processamento e feito pelo Railway.

#### 2. Adicionar comentario arquitetural em `Automations.tsx`

Adicionar um bloco de comentario no topo do ficheiro (apos os imports) documentando que:
- O motor roda no Railway, nao em Edge Functions
- O frontend apenas dispara via HTTP POST e le os resultados das tabelas
- Nunca usar `supabase.functions.invoke("process-automations")`

### Ficheiros afetados

- `supabase/functions/process-automations/index.ts` -- APAGAR (funcao deployada tambem sera removida)
- `src/pages/Automations.tsx` -- Adicionar comentario arquitetural (2-3 linhas)

### O que NAO muda

- Toda a logica de UI, polling, kill switch, logs, e CRUD de regras continua igual
- As tabelas `motor_control`, `automation_logs`, `whatsapp_messages_log` continuam a ser lidas pelo frontend
- A chamada ao Railway em `runEngineMutation` ja esta correta

