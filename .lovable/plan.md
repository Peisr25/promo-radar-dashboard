

# Migrar de WAHA para Evolution API

## Resumo
Alterar o provedor de disparo do WhatsApp de WAHA para Evolution API, atualizando endpoints, headers, payloads e textos da interface.

## Alteracoes

### 1. Interface - `src/pages/WhatsAppSettings.tsx`
- Linha 132: "Conexao com WAHA" -> "Conexao com Evolution API"
- Linha 133: "Configure sua sessao WAHA..." -> "Configure sua instancia Evolution API..."
- Linha 147: Label "Nome da Sessao" -> "Nome da Instancia"
- Nenhuma variavel de codigo muda, apenas textos visiveis ao usuario.

### 2. Edge Function - `supabase/functions/send-whatsapp-message/index.ts`

**Header de autenticacao (todas as requisicoes):**
- Trocar `"X-Api-Key": config.api_key` por `"apikey": config.api_key`

**Bloco `test` (linhas 64-102):**
- URL: `${baseUrl}/api/sessions` -> `${baseUrl}/instance/connectionState/${config.session_name}`
- Logica de sucesso: verificar se `res.ok` e se o objeto retornado indica conexao ativa (ex: `data?.instance?.state === "open"` ou simplesmente `res.ok && data != null`)
- Mensagem de erro: trocar "WAHA" por "Evolution API"

**Bloco `fetch_groups` (linhas 106-172):**
- URL: `${baseUrl}/api/${config.session_name}/groups?...` -> `${baseUrl}/group/fetchAllGroups/${config.session_name}?getParticipants=false`
- Remover query params de limit/offset/exclude (Evolution API nao usa esses params neste endpoint)
- Manter conversao object-to-array como seguranca, mas Evolution API retorna array direto
- Trocar mensagens de erro de "WAHA" para "Evolution API"

**Bloco `send` (linhas 176-230):**
- **Sem imagem:**
  - Endpoint: `${baseUrl}/api/sendText` -> `${baseUrl}/message/sendText/${config.session_name}`
  - Payload: `{ session, chatId, text }` -> `{ number: group_id, text }`
- **Com imagem:**
  - Endpoint: `${baseUrl}/api/sendImage` -> `${baseUrl}/message/sendMedia/${config.session_name}`
  - Payload: `{ session, chatId, caption, file: { url } }` -> `{ number: group_id, mediatype: "image", mimetype: "image/jpeg", media: hiResUrl, caption: text }`
  - Remover fallback 422 (Evolution API suporta sendMedia nativamente)
- Manter redimensionamento de imagem (`replace(/\/\d+x\d+\//, '/800x800/')`)

**Mensagem de config ausente (linha 54):**
- "WAHA nao configurado..." -> "Evolution API nao configurada..."

### 3. Nenhuma alteracao necessaria
- `src/lib/evolution-api.ts` - ja esta correto, nao precisa mudar
- Banco de dados - sem alteracoes
- Tabela `evolution_config` - mesma estrutura (api_url, api_key, session_name)

## Detalhes Tecnicos

### Mapeamento de Endpoints

```text
WAHA                                    -> Evolution API
------------------------------------------------------
GET  /api/sessions                      -> GET  /instance/connectionState/{instance}
GET  /api/{session}/groups?...          -> GET  /group/fetchAllGroups/{instance}?getParticipants=false
POST /api/sendText                      -> POST /message/sendText/{instance}
POST /api/sendImage                     -> POST /message/sendMedia/{instance}
```

### Header de Autenticacao
```text
WAHA:       "X-Api-Key": apiKey
Evolution:  "apikey": apiKey
```

### Payloads de Envio
```text
-- Texto (Evolution API) --
POST /message/sendText/{instance}
{ "number": "120363...@g.us", "text": "mensagem" }

-- Midia (Evolution API) --
POST /message/sendMedia/{instance}
{ "number": "120363...@g.us", "mediatype": "image", "mimetype": "image/jpeg", "media": "https://...", "caption": "mensagem" }
```
