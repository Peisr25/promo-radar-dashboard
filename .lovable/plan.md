

## Corrigir Contadores e Watchdog do Motor

### Problema 1: Contadores misturam produtos com grupos

O contador `sent` incrementa **por grupo enviado** (linha 431), nao por produto. Resultado: 1 produto enviado a 3 grupos aparece como "3 enviado(s)" no resumo, quando deveria ser "1 produto(s) enviado(s) para 3 grupo(s)".

**Solucao:** Separar contadores de produto dos contadores de grupo.

- Adicionar `productsSent`, `productsSkipped`, `productsErrors` para rastrear produtos
- Manter `sent` (renomear para `groupsSentTotal`) para rastrear envios por grupo
- Incrementar `productsSent` uma vez por scrape processado com sucesso (apos o broadcast loop)
- Atualizar o log final para mostrar: `"1 produto(s) enviado(s) para 3 grupo(s), 4 ignorado(s)"`

### Problema 2: Watchdog nao protege dentro do broadcast loop

O check de timeout (linha 180) so executa no inicio de cada iteracao do loop de scrapes. Se um unico scrape demora 80s (geracao IA + 3 grupos x 8s delay), o watchdog nao interrompe.

**Solucao:** Adicionar verificacao de timeout dentro do broadcast loop (antes de enviar para cada grupo):

```text
for (const group of targetGroups) {
  if (Date.now() - startTime > MAX_EXECUTION_MS) {
    timedOut = true;
    break; // Sai do broadcast loop
  }
  // ... envio existente
}
```

### Alteracoes no ficheiro

`supabase/functions/process-automations/index.ts`:

1. **Linhas 170-172** -- Adicionar contadores de produto:
   - `let productsSent = 0;`
   - `let productsSkipped = 0;`
   - `let productsErrors = 0;`

2. **Linha 242 (skipped)** -- Adicionar `productsSkipped++` junto ao `skipped++` existente

3. **Linha 387-396 (broadcast loop)** -- Adicionar check de timeout antes de cada envio de grupo

4. **Linha 431** -- Manter `sent++` como contagem de grupos, mas adicionar `productsSent++` apos o broadcast loop (linha ~475, antes do update de status)

5. **Linhas 481-499 (catch do scrape)** -- Adicionar `productsErrors++`

6. **Linha 509 (log final)** -- Alterar mensagem para:
   `"Motor finalizado em Xs: Y produto(s) -> Z grupo(s), W ignorado(s), E erro(s)"`

7. **Linhas 510-519 (metadata final)** -- Adicionar `products_sent`, `products_skipped`, `products_errors`, `groups_sent_total`

8. **Linhas 522-528 (motor_control update)** -- Usar `productsSent` e `productsSkipped` nos campos `last_run_sent` e `last_run_skipped`

### Resultado esperado

- Log claro: "Motor finalizado em 30s: 1 produto(s) -> 3 grupo(s), 4 ignorado(s), 0 erro(s)"
- Watchdog protege mesmo dentro do broadcast de um unico produto
- Contadores em `motor_control` refletem produtos, nao grupos

