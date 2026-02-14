
# Migrar Integracao de Evolution API para WAHA

## Resumo
Adaptar toda a integracao WhatsApp do projeto para usar o WAHA (WhatsApp HTTP API) em vez da Evolution API. As mudancas afetam a edge function (proxy backend), o cliente frontend, e os textos da pagina de configuracoes. A estrutura do banco de dados sera mantida (tabela `evolution_config`) com a coluna `instance_name` renomeada para `session_name`.

## Alteracoes

### 1. Banco de Dados
- Renomear coluna `instance_name` para `session_name` na tabela `evolution_config`
- Definir valor default `'default'` para `session_name`

### 2. Edge Function `send-whatsapp-message`
Atualizar os 3 endpoints para usar formato WAHA:

- **Header**: `apikey` passa a `X-Api-Key`
- **Test**: `/instance/connectionState/{instance}` passa a `/api/{session}/status`
- **Fetch groups**: `/group/fetchAllGroups/{instance}` passa a `/api/{session}/groups`, campo `subject` passa a `name`
- **Send**: `/message/sendText/{instance}` passa a `/api/sendText`, body muda de `{ number, text }` para `{ session, chatId, text }`
- Atualizar mensagens de erro de "Evolution API" para "WAHA"

### 3. Frontend - `src/lib/evolution-api.ts`
- Sem mudanca estrutural (ja usa a edge function como proxy)
- O ficheiro pode ser mantido como esta, pois so chama `supabase.functions.invoke("send-whatsapp-message")`

### 4. Frontend - `src/pages/WhatsAppSettings.tsx`
- Atualizar labels: "Evolution API" para "WAHA"
- Atualizar label "Nome da Instancia" para "Nome da Sessao"
- Atualizar placeholder de "minha-instancia" para "default"
- Atualizar descricao do card
- Atualizar referencia de campo `instance_name` para `session_name` no state e nas queries

### 5. Nenhuma alteracao necessaria em
- `Pipeline.tsx` - ja usa `evolution-api.ts` que chama a edge function
- `AppSidebar.tsx` - rota `/whatsapp` ja esta correta
- `App.tsx` - rota ja esta correta

## Detalhes Tecnicos

### Migracao SQL
```text
ALTER TABLE evolution_config RENAME COLUMN instance_name TO session_name;
ALTER TABLE evolution_config ALTER COLUMN session_name SET DEFAULT 'default';
```

### Edge Function - Mudancas de Endpoints

Teste de conexao:
```text
Antes: GET {api_url}/instance/connectionState/{instance_name}
        Header: apikey
Depois: GET {api_url}/api/{session_name}/status
        Header: X-Api-Key
```

Buscar grupos:
```text
Antes: GET {api_url}/group/fetchAllGroups/{instance_name}?getParticipants=false
        Header: apikey
Depois: GET {api_url}/api/{session_name}/groups
        Header: X-Api-Key
        Resposta: group.name (antes era group.subject)
```

Enviar mensagem:
```text
Antes: POST {api_url}/message/sendText/{instance_name}
        Header: apikey
        Body: { number: group_id, text }
Depois: POST {api_url}/api/sendText
        Header: X-Api-Key
        Body: { session: session_name, chatId: group_id, text }
```

### Ficheiros a modificar
1. Migracao SQL (renomear coluna)
2. `supabase/functions/send-whatsapp-message/index.ts` (endpoints + headers + body)
3. `src/pages/WhatsAppSettings.tsx` (labels + campo session_name)
