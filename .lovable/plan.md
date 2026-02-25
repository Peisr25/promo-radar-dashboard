

# Plano Atualizado: Build Fixes + Shopee + Delay Configuravel

## Resumo

Tres frentes: (1) corrigir 8 erros de build em 3 Edge Functions, (2) integrar Shopee com tabela de credenciais, card na UI e atualizacao do start-scrape, e (3) adicionar campo configuravel de delay entre mensagens no motor.

---

## 1. Correcao dos 8 Build Errors

### `process-automations/index.ts` (linhas 448, 454)
O PostgREST builder nao tem `.catch()`. Solucao: wrapping em try/catch silencioso.

```text
// Linha 447-448: trocar
await admin.from("motor_control").update({...}).eq("user_id", userId).catch(() => {});
// por:
try { await admin.from("motor_control").update({...}).eq("user_id", userId); } catch {}
```

```text
// Linha 449-454: wrapping similar
try { await admin.from("automation_logs").insert({...}); } catch {}
```

### `send-whatsapp-message/index.ts` (linhas 99, 159, 162, 215, 227)
Adicionar cast `(e as Error)` em 5 locais:
- Linha 99: `(e as Error).message`
- Linha 159: `(e as Error).name`
- Linha 162: `(e as Error).message`
- Linha 215: `(e as Error).message`
- Linha 227: `(e as Error).message`

### `start-scrape/index.ts` (linha 32)
- `(error as Error).message`

---

## 2. Nova Tabela `source_credentials` (Migracao SQL)

```text
CREATE TABLE public.source_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_name text NOT NULL,
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, source_name)
);

ALTER TABLE public.source_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own source credentials"
ON public.source_credentials FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 3. Atualizacao de `Sources.tsx`

Adicionar acima da tabela existente um **Card "Shopee Afiliados"** com:

- **Badge de status**: query a `source_credentials` onde `source_name = 'shopee'`. Se existir -> "Pronto" (verde), senao -> "Nao Configurado" (cinza)
- **Botao "Configurar API"**: abre Dialog com inputs para App ID e App Secret (password)
  - Ao guardar: `upsert` em `source_credentials` com `source_name = 'shopee'`, `credentials = { app_id, app_secret }`
  - Ao abrir: carrega credenciais existentes (mostra App ID, mascara Secret)
- **Botao "Sincronizar"**: desabilitado se nao configurado; chama `start-scrape` com `{ source: "shopee" }`

---

## 4. Atualizacao de `start-scrape/index.ts`

Adicionar ramo condicional antes do fluxo existente:

```text
const body = await req.json();
const { source_id, site_name, source } = body;

if (source === "shopee") {
  // Extrair userId do JWT via userClient
  // Admin client: consultar source_credentials onde user_id + source_name = 'shopee'
  // Se nao encontrar -> erro 400
  // POST para Railway: /api/scrape/shopee com { app_id, app_secret, user_id }
  // Retornar resposta do Railway
} else {
  // Fluxo existente inalterado (POST para /api/start-scrape)
}
```

Tambem precisa de autenticacao (criar userClient para extrair userId) e adminClient (service role) para ler credenciais.

---

## 5. Delay Configuravel entre Mensagens

### Alteracao na tabela `motor_control`
Adicionar coluna via migracao:

```text
ALTER TABLE public.motor_control
ADD COLUMN IF NOT EXISTS delay_between_messages integer NOT NULL DEFAULT 8;
```

### Alteracao em `process-automations/index.ts`
- Ler `delay_between_messages` do `motor_control` (ja faz select `*` na linha 80-84)
- Substituir o hardcoded `setTimeout(r, 8000)` por `setTimeout(r, delay * 1000)` onde `delay = existingCtrl?.delay_between_messages ?? 8`

### Alteracao em `Automations.tsx`
- Adicionar ao `MotorControl` interface: `delay_between_messages: number | null`
- No painel de configuracoes, adicionar um terceiro campo "Delay entre Mensagens (segundos)" ao lado dos limites hora/dia
- Estado: `delayBetween` inicializado do `motorControl?.delay_between_messages ?? 8`
- Salvar junto com os limites no `saveLimitsMutation`
- Exibir valor atual no resumo: `Atual: X/h, Y/dia, Zs delay`

---

## 6. Ficheiros a criar/editar

| Ficheiro | Acao |
|---|---|
| Migracao SQL | Criar `source_credentials` + adicionar `delay_between_messages` ao `motor_control` |
| `supabase/functions/process-automations/index.ts` | Fix `.catch()` + usar delay configuravel |
| `supabase/functions/send-whatsapp-message/index.ts` | Fix 5x tipo `unknown` |
| `supabase/functions/start-scrape/index.ts` | Fix tipo `unknown` + ramo Shopee |
| `src/pages/Sources.tsx` | Card Shopee + modal credenciais + sync |
| `src/pages/Automations.tsx` | Campo delay configuravel nas settings |

---

## 7. Fluxo Shopee

```text
[Sources.tsx]
  |-- Card Shopee (badge: "Nao Configurado")
  |-- Clica "Configurar API"
  |     |-- Modal: App ID + App Secret
  |     |-- Guardar -> upsert source_credentials(shopee)
  |     |-- Badge muda para "Pronto"
  |
  |-- Clica "Sincronizar Shopee"
        |-- POST start-scrape { source: "shopee" }
        |-- Edge Function le credenciais da BD via admin client
        |-- POST Railway /api/scrape/shopee { app_id, app_secret }
        |-- Produtos aparecem em raw_scrapes
```

## 8. Fluxo Motor com Delay Configuravel

```text
[Automations.tsx] -> Settings -> "Delay entre Mensagens: 8s"
  |-- Salva em motor_control.delay_between_messages

[process-automations]
  |-- Le motor_control (ja faz select *)
  |-- delay = ctrl.delay_between_messages ?? 8
  |-- Apos envio: await setTimeout(delay * 1000)
```

