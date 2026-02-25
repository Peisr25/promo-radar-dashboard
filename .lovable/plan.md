

# Refatoracao do Motor de Automacao - 5 Correcoes Criticas

## Resumo

Corrigir 5 problemas na arquitetura do motor de automacao: delay anti-spam, prevencao de links inventados pela IA, logs descritivos, contabilizacao de estatisticas, e kill switch real via base de dados.

## Alteracoes

### 1. Nova tabela `motor_control` (Migracao SQL)

Tabela simples para o kill switch do motor:

```text
CREATE TABLE public.motor_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  is_running boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.motor_control ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own motor control"
ON public.motor_control FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### 2. Edge Function `process-automations/index.ts` - Refatoracao completa

Alteracoes no loop principal:

**Kill Switch (inicio de cada iteracao):**
```text
// No inicio de cada iteracao do loop de scrapes:
const { data: ctrl } = await admin
  .from("motor_control")
  .select("is_running")
  .eq("user_id", userId)
  .single();

if (ctrl && !ctrl.is_running) {
  // Log de paragem
  await admin.from("automation_logs").insert({
    user_id: userId,
    status: "skipped",
    message: "Motor pausado pelo utilizador.",
  });
  break;
}
```

**Delay Anti-Spam:**
- Substituir o `setTimeout(r, 2000)` atual por `setTimeout(r, 8000)` apos cada envio bem-sucedido

**Prevencao de Links Inventados pela IA:**
- Remover `original_url` do payload enviado a `generate-promo-message` (para que a IA nao veja o link)
- Apos receber o texto da IA, criar o short link diretamente no banco via `short_links` usando o admin client
- Concatenar manualmente: `const finalMessage = aiText + "\n\n" + shortUrl;`
- Enviar `finalMessage` ao WhatsApp em vez de `promoText`

**Logs Descritivos:**
- Processing: `Processando: ${title.substring(0, 50)}... (Desc: ${discount}%)`
- Success: `Enviado: ${title.substring(0, 40)} -> ${group.group_name}`
- Error: mensagem real do erro (ja implementado, manter)

**Contabilizacao de Estatisticas:**
- Apos envio bem-sucedido, chamar `admin.rpc('increment_group_messages', { group_id_param: matchedRule.target_group_id })` (funcao ja existe no banco)
- Inserir na tabela `whatsapp_messages_log` com dados do envio para alimentar metricas do Dashboard

**Inicio do Motor:**
- Antes de comecar o loop, fazer upsert na `motor_control` com `is_running = true`
- Ao finalizar (fim normal, break, ou erro), fazer update para `is_running = false`

### 3. Edge Function `generate-promo-message/index.ts` - Ajuste nos prompts

- No `buildDefaultPrompt()`: remover a linha `[Link Encurtado que foi fornecido]` e adicionar regra explicita: `- NAO inclua links ou URLs na resposta.`
- No `buildCustomPrompt()`: remover `Finalize sempre com o Preco e o Link.` e adicionar regra: `- NAO inclua links ou URLs na resposta. O link sera adicionado automaticamente.`
- No user content: remover a linha que adiciona `\nLink: ${original_url}`

### 4. UI `Automations.tsx` - Kill Switch real

- Substituir o botao "Parar Execucao" baseado em AbortController pelo novo mecanismo de flag na BD
- Ao clicar "Executar Motor Agora":
  1. Fazer upsert em `motor_control` com `is_running = true`
  2. Invocar `process-automations`
- Ao clicar "Pausar Motor":
  1. Fazer update em `motor_control` com `is_running = false`
  2. Toast informando que a paragem foi solicitada
- Adicionar query para monitorar o estado de `motor_control.is_running` (para mostrar estado correto do botao)
- Invalidar queries de logs e motor_control ao terminar

### 5. Ficheiros a criar/editar

| Ficheiro | Acao |
|---|---|
| Migracao SQL (motor_control) | Criar tabela para kill switch |
| `supabase/functions/process-automations/index.ts` | Refatorar com delay 8s, kill switch, short links, logs ricos, estatisticas |
| `supabase/functions/generate-promo-message/index.ts` | Remover links dos prompts |
| `src/pages/Automations.tsx` | Implementar kill switch via BD |

### Fluxo atualizado do loop

```text
[Botao UI] --> upsert motor_control(is_running=true)
           --> POST process-automations

Para cada scrape:
  |-- Verificar motor_control.is_running (se false -> break + log)
  |-- Testar match (categoria + desconto)
  |
  |-- MATCH:
  |     |-- Log: "Processando: [titulo] (Desc: X%)"
  |     |-- generate-promo-message (SEM link no prompt)
  |     |-- Criar/buscar short_link no banco
  |     |-- finalMessage = aiText + "\n\n" + shortUrl
  |     |-- send-whatsapp-message (com finalMessage)
  |     |-- increment_group_messages (RPC)
  |     |-- INSERT whatsapp_messages_log
  |     |-- Log: "Enviado: [titulo] -> [grupo]"
  |     |-- scrape status = 'published'
  |     |-- await 8 segundos
  |
  |-- SEM MATCH: scrape status = 'skipped'

Ao finalizar: motor_control(is_running=false)
```

### Detalhes tecnicos do encurtador de links no backend

Como o encurtador de links (`link-shortener.ts`) usa o Supabase client do frontend, a logica sera replicada diretamente na Edge Function usando o admin client:

```text
// Verificar se ja existe
const { data: existing } = await admin
  .from("short_links")
  .select("short_code")
  .eq("original_url", scrape.original_url)
  .maybeSingle();

let shortUrl: string;
if (existing) {
  shortUrl = `https://radardaspromos.lovable.app/r/${existing.short_code}`;
} else {
  const shortCode = generateShortCode(); // funcao local
  await admin.from("short_links").insert({
    user_id: userId,
    original_url: scrape.original_url,
    short_code: shortCode,
    product_title: scrape.product_title,
    source: "automation",
  });
  shortUrl = `https://radardaspromos.lovable.app/r/${shortCode}`;
}
```

