

## Gestao Avancada de Grupos WhatsApp - Transbordo

### 1. Migracoes de Base de Dados

Adicionar as 3 novas colunas a tabela `whatsapp_groups`:

```sql
ALTER TABLE public.whatsapp_groups
  ADD COLUMN participant_count integer DEFAULT 0,
  ADD COLUMN max_participants integer DEFAULT 1024,
  ADD COLUMN is_full boolean DEFAULT false;
```

### 2. Nova Edge Function: manage-whatsapp-groups

Criar `supabase/functions/manage-whatsapp-groups/index.ts` com:

- CORS headers padrao
- Autenticacao via Bearer token (mesmo padrao do send-whatsapp-message)
- Leitura da `evolution_config` do utilizador via service role client
- Duas actions:

**action: sync_counts**
- GET `${baseUrl}/group/fetchAllGroups/${instanceName}?getParticipants=false`
- Para cada grupo retornado, fazer match pelo `group_id` (JID) na tabela `whatsapp_groups`
- UPDATE `participant_count = size`, `is_full = (size >= max_participants)`
- Retornar contagem de grupos atualizados

**action: create**
- Receber `name`, `admin_number`, `categories`, `is_flash_deals_only`
- POST `${baseUrl}/group/create/${instanceName}` com `{ subject: name, participants: [admin_number] }`
- Extrair o JID gerado da resposta
- GET `${baseUrl}/group/inviteCode/${instanceName}?groupJid={jid}` para obter link de convite
- INSERT na tabela `whatsapp_groups` com todos os dados (usando user_id do token)
- Retornar o grupo criado

Adicionar ao `supabase/config.toml`:
```toml
[functions.manage-whatsapp-groups]
verify_jwt = false
```

### 3. Atualizar WhatsAppSettings.tsx

**3a. Coluna "Ocupacao" na tabela**
- Nova `TableHead` "Ocupacao" entre "Nichos" e "Enviadas"
- Barra de progresso (`Progress` component) mostrando `participant_count / max_participants`
- Se `is_full === true`, Badge vermelha "LOTACAO MAXIMA" em vez da barra

**3b. Botao "Sincronizar Vagas"**
- Novo botao no header do card de grupos, ao lado de "Buscar da API"
- Chama `supabase.functions.invoke("manage-whatsapp-groups", { body: { action: "sync_counts" } })`
- Estado `syncingCounts` para loading
- Apos sucesso, recarrega a lista

**3c. Checkboxes e Acoes em Massa (Bulk Edit)**
- Estado `selectedIds: Set<string>` para rastrear selecao
- Checkbox no header da tabela (selecionar/desselecionar todos)
- Checkbox em cada linha
- Quando ha itens selecionados, mostrar barra de acoes com:
  - Dropdown "Alterar Nichos" - abre modal com badges clicaveis, aplica update em massa
  - Botao "Ativar/Desativar" - toggle `is_active` nos selecionados
  - Botao "Flash Deals" - toggle `is_flash_deals_only` nos selecionados
- Cada acao faz update no Supabase para todos os IDs selecionados e recarrega

**3d. Modal "Criar Novo Grupo (API)"**
- Novo botao "Criar Novo Grupo (API)" com icone de sparkles ao lado do botao "Adicionar"
- Abre um Dialog separado (`createApiDialogOpen`)
- Campos: Nome do Grupo (Input), Numero do Admin (Input com placeholder "+5511..."), Nichos (Badges clicaveis), Toggle Flash Deals
- Ao salvar, chama `supabase.functions.invoke("manage-whatsapp-groups", { body: { action: "create", name, admin_number, categories, is_flash_deals_only } })`
- Recarrega a lista apos sucesso

### Resumo de ficheiros

| Ficheiro | Tipo | Descricao |
|---|---|---|
| Migracao SQL | DB | Adicionar participant_count, max_participants, is_full |
| `supabase/functions/manage-whatsapp-groups/index.ts` | Novo | Edge function com sync_counts e create |
| `supabase/config.toml` | Config | Adicionar entry para manage-whatsapp-groups |
| `src/pages/WhatsAppSettings.tsx` | Editar | Coluna ocupacao, bulk edit, sync vagas, criar via API |

### Novos imports no WhatsAppSettings

- `Progress` de `@/components/ui/progress`
- `Checkbox` de `@/components/ui/checkbox`
- `Users, Sparkles` de `lucide-react`
- `DropdownMenu` components de `@/components/ui/dropdown-menu`

