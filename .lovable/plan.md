

## Refatorar Motor para Batching + Watchdog de 45s

### Resumo

Tres alteracoes cirurgicas no `process-automations/index.ts` para garantir que o motor nunca ultrapasse o tempo limite da Edge Function:

---

### 1. Batch Size -- `.limit(5)`

**Linha 96** -- Adicionar `.limit(5)` na query de scrapes pendentes:

```text
// DE:
admin.from("raw_scrapes").select("*").eq("status", "pending")

// PARA:
admin.from("raw_scrapes").select("*").eq("status", "pending").limit(5)
```

Isto garante que cada execucao processa no maximo 5 produtos. Os restantes ficam com status `pending` e serao apanhados na proxima execucao.

---

### 2. Watchdog -- 45 segundos

**Linha 175** -- Reduzir o timeout de 120s para 45s:

```text
// DE:
const MAX_EXECUTION_MS = 120_000; // 120s safety margin

// PARA:
const MAX_EXECUTION_MS = 45_000; // 45s safety -- well within Edge Function limit
```

O guard ja existe no loop (linha 180) e faz `break` quando o tempo e excedido. Apenas precisamos baixar o valor para 45s.

---

### 3. Tratamento Individual de Erros

O try/catch por scrape **ja existe** (linhas 309-499). Cada produto e processado individualmente -- se a IA ou o WhatsApp falhar para um produto, o erro e registado no log e o loop continua para o proximo. Nenhuma alteracao necessaria aqui.

O try/catch por grupo dentro do broadcast loop **tambem ja existe** (linhas 398-450).

---

### Ficheiro modificado

- `supabase/functions/process-automations/index.ts` -- 2 alteracoes de linha (limit + timeout)

### Resultado esperado

O motor vai processar lotes de 5 produtos por execucao, com um limite de 45s. Se um Cron Job chamar a funcao a cada minuto, processara ate 5 produtos/minuto de forma segura, sem timeouts.

