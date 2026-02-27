

## Agendamento Automatico - Sync de Participantes a Cada 3 Horas

### O que sera feito

Configurar um cron job que roda a cada 3 horas para sincronizar automaticamente a contagem de participantes de todos os grupos WhatsApp de todos os usuarios.

### Alteracoes

#### 1. Edge Function `manage-whatsapp-groups` - Nova action `cron_sync_all`

Adicionar uma nova action que:
- Nao exige autenticacao de usuario (sera chamada pelo cron com anon key)
- Valida que a chamada vem do cron verificando um header especial ou simplesmente usando service_role internamente
- Busca TODOS os usuarios com `evolution_config` ativa
- Para cada usuario, executa a logica de `sync_counts` existente (busca grupos da Evolution API e atualiza contagens no banco)
- Retorna um resumo global (total de usuarios processados, grupos atualizados)

Fluxo simplificado:
```text
cron_sync_all ->
  1. adminClient busca todos evolution_config onde is_active = true
  2. Para cada config (usuario):
     a. Chama Evolution API fetchAllGroups
     b. Busca whatsapp_groups do usuario no banco
     c. Atualiza participant_count e is_full
  3. Retorna resumo
```

A action `cron_sync_all` sera acionada quando o body contiver `{"action": "cron_sync_all"}`. Neste caso, o bloco de autenticacao de usuario sera pulado (early return antes do getClaims).

#### 2. Cron Job via pg_cron + pg_net

Executar SQL (via insert tool, nao migration) para:
- Habilitar extensoes `pg_cron` e `pg_net` (se ainda nao habilitadas)
- Criar o schedule `sync-group-counts-every-3h` com expressao `0 */3 * * *`
- O job faz um POST para a edge function com `{"action": "cron_sync_all"}` e o anon key no header Authorization

### Secao Tecnica

**Ficheiros alterados:**
- `supabase/functions/manage-whatsapp-groups/index.ts` - adicionar action `cron_sync_all` com bypass de auth

**SQL executado (insert tool):**
- Habilitar extensoes pg_cron e pg_net
- Criar cron schedule apontando para a URL da edge function

**Seguranca:**
- A action `cron_sync_all` usa internamente o `service_role_key` para acessar dados de todos os usuarios
- Nao expoe dados sensiveis na resposta
- A anon key no header e suficiente pois `verify_jwt = false` ja esta configurado

