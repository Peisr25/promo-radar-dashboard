
## Plano: Transbordo Automatico na Edge Function

### Resumo

Quando o `sync_counts` detecta que um grupo acabou de lotar (transicao `is_full: false -> true`), cria automaticamente o proximo grupo via Evolution API, herdando categorias e configuracoes do grupo original.

### Mudancas na Edge Function `manage-whatsapp-groups/index.ts`

#### 1. Expandir o SELECT dos dbGroups

Atualmente o `sync_counts` faz `select("id, group_id, max_participants")`. Precisamos adicionar `group_name, categories, is_flash_deals_only, is_full, user_id` para ter os dados necessarios para o transbordo.

#### 2. Adicionar helper `getNextGroupName`

Funcao que extrai o numero do nome do grupo via regex e incrementa:
- `"Radar das Promos TECH #01"` -> `"Radar das Promos TECH #02"`
- `"Radar das Promos TECH #09"` -> `"Radar das Promos TECH #10"`
- `"Meu Grupo"` (sem numero) -> `"Meu Grupo #02"`

Regex: `/(.*?)\s*#(\d+)$/` -- captura prefixo e numero, incrementa com zero-padding.

#### 3. Logica de transbordo apos o update

Dentro do loop do `sync_counts`, logo apos o `.update({ is_full: isFull })`:

```text
if (isFull && !dbg.is_full) {
  // Grupo acabou de lotar nesta execucao
  1. Gerar novo nome com getNextGroupName(dbg.group_name)
  2. Ler ADMIN_WHATSAPP_NUMBER do Deno.env
  3. POST /group/create/{instance} com { subject: novoNome, participants: [adminNumber] }
  4. GET /group/inviteCode/{instance}?groupJid={novoJid}
  5. INSERT na tabela whatsapp_groups herdando:
     - user_id: userId (do contexto autenticado)
     - categories: dbg.categories
     - is_flash_deals_only: dbg.is_flash_deals_only
     - participant_count: 1, is_full: false, is_active: true
  6. Incrementar contador de transbordos
}
```

#### 4. Atualizar resposta

O retorno do `sync_counts` passara a incluir `overflows` (numero de transbordos criados) e `overflow_details` (array com nomes dos novos grupos).

#### 5. Aplicar a mesma logica no `cron_sync_all`

O `cron_sync_all` tambem faz sync de contagens. Aplicar a mesma logica de transbordo la, usando o `config.api_key` e `config.api_url` do loop, e lendo `ADMIN_WHATSAPP_NUMBER` do env. Adicionar `totalOverflows` ao retorno.

### Timer anti-spam

Antes de criar o grupo via API, aguardar 8 segundos (`await new Promise(r => setTimeout(r, 8000))`) conforme o padrao anti-spam ja estabelecido no projeto.

### Arquivo modificado

- `supabase/functions/manage-whatsapp-groups/index.ts`

Nenhuma mudanca de schema e necessaria -- todos os campos ja existem na tabela `whatsapp_groups`.
