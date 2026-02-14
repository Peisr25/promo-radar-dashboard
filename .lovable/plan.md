

# Integracao com Evolution API para Envio Automatico no WhatsApp

## Resumo
Implementar integracao completa com a Evolution API para envio automatico de mensagens promocionais para grupos do WhatsApp diretamente do Pipeline, eliminando o fluxo manual de copiar/colar.

## Arquitetura

As chamadas a Evolution API serao feitas via uma edge function (backend) para nao expor a API key no navegador do usuario. A configuracao (URL, API key, instancia) sera armazenada numa tabela com RLS. O frontend envia pedidos para a edge function que faz proxy para a Evolution API.

## Alteracoes

### 1. Banco de Dados - Novas Tabelas

Criar 3 tabelas com RLS:

- **evolution_config**: armazena credenciais da Evolution API por usuario (api_url, api_key, instance_name, is_active, last_test_at, last_test_status)
- **whatsapp_groups**: grupos de destino por usuario (group_id no formato `120363...@g.us`, group_name, is_active, messages_sent, last_message_at)
- **whatsapp_messages_log**: historico de envios (promotion_id referenciando promotions.id como UUID, group_id, message_text, status, error_message, api_response)

Criar funcao `increment_group_messages(group_id_param)` para atualizar contadores.

Todas as tabelas terao RLS com politica `auth.uid() = user_id`.

### 2. Edge Function - `send-whatsapp-message`

Nova edge function que:
- Recebe `{ group_id, text, user_id }` no body
- Busca a `evolution_config` do usuario via service role
- Faz POST para `{api_url}/message/sendText/{instance_name}` com a apikey
- Retorna sucesso/erro
- Tambem suportara acao `test_connection` para verificar estado da instancia
- Tambem suportara acao `fetch_groups` para listar grupos da instancia via Evolution API

### 3. Pagina de Configuracoes WhatsApp

Novo ficheiro `src/pages/WhatsAppSettings.tsx` com:
- Formulario para URL da API, API Key e nome da instancia
- Botao "Testar Conexao"
- Secao para gerir grupos (adicionar/remover)
- Botao para buscar grupos automaticamente da Evolution API
- Tabela com estatisticas de envio por grupo

### 4. Alteracoes no Pipeline

No `src/pages/Pipeline.tsx`, na aba "Fila WhatsApp":
- Adicionar botao "Enviar para WhatsApp" em cada item da fila
- Dialog de selecao de grupos com checkboxes
- Envio sequencial com delay entre mensagens
- Feedback visual (loading, sucesso, erro)
- Atualizar status para "sent" automaticamente apos envio bem-sucedido

### 5. Navegacao

- Adicionar item "WhatsApp" no sidebar (`src/components/AppSidebar.tsx`) com icone MessageCircle
- Adicionar rota `/whatsapp` no `src/App.tsx`

## Detalhes Tecnicos

### Tabelas SQL

```text
evolution_config:
  id UUID PK default gen_random_uuid()
  user_id UUID NOT NULL (unique)
  api_url TEXT NOT NULL
  api_key TEXT NOT NULL
  instance_name TEXT NOT NULL
  is_active BOOLEAN DEFAULT true
  last_test_at TIMESTAMPTZ
  last_test_status TEXT
  created_at TIMESTAMPTZ DEFAULT now()
  updated_at TIMESTAMPTZ DEFAULT now()

whatsapp_groups:
  id UUID PK default gen_random_uuid()
  user_id UUID NOT NULL
  group_id TEXT NOT NULL
  group_name TEXT NOT NULL
  group_description TEXT
  is_active BOOLEAN DEFAULT true
  messages_sent INTEGER DEFAULT 0
  last_message_at TIMESTAMPTZ
  created_at TIMESTAMPTZ DEFAULT now()
  updated_at TIMESTAMPTZ DEFAULT now()
  UNIQUE(user_id, group_id)

whatsapp_messages_log:
  id UUID PK default gen_random_uuid()
  user_id UUID NOT NULL
  promotion_id UUID REFERENCES promotions(id)
  group_id UUID REFERENCES whatsapp_groups(id)
  message_text TEXT NOT NULL
  status TEXT NOT NULL DEFAULT 'pending'
  error_message TEXT
  api_response JSONB
  created_at TIMESTAMPTZ DEFAULT now()
```

### Edge Function `send-whatsapp-message`

```text
POST body:
{
  "action": "send" | "test" | "fetch_groups",
  "group_id": "120363...@g.us",   // para action=send
  "text": "mensagem"               // para action=send
}

- Busca config do usuario autenticado via Authorization header
- Usa SUPABASE_SERVICE_ROLE_KEY para ler evolution_config (contorna RLS)
- Faz proxy da chamada para Evolution API
- Regista log em whatsapp_messages_log
```

### Pipeline - Botao de envio

Na aba "Fila WhatsApp", cada card tera:
- Botao verde "Enviar WhatsApp" que abre dialog
- Dialog mostra checkboxes com grupos ativos
- Botao "Enviar para X grupo(s)" executa envios sequenciais
- Apos envio bem-sucedido para todos os grupos, status muda para "sent"

### Ficheiros a criar/modificar

1. **Criar** migration SQL para as 3 tabelas + funcao increment
2. **Criar** `supabase/functions/send-whatsapp-message/index.ts`
3. **Criar** `src/lib/evolution-api.ts` - cliente que chama a edge function
4. **Criar** `src/pages/WhatsAppSettings.tsx` - pagina de configuracao
5. **Modificar** `src/components/AppSidebar.tsx` - adicionar menu WhatsApp
6. **Modificar** `src/App.tsx` - adicionar rota /whatsapp
7. **Modificar** `src/pages/Pipeline.tsx` - adicionar botao envio + dialog selecao grupos
8. **Modificar** `supabase/config.toml` - adicionar verify_jwt=false para nova function

