

# Melhorar Feedback Visual apos Sincronizacao

## Diagnostico

A sincronizacao **esta a funcionar corretamente**. O pedido ao servidor externo retornou sucesso (`200 OK`), e o toast de confirmacao apareceu. O problema e que nao existe feedback visual adicional no dashboard -- o status da fonte continua "Pendente" e nao ha atualizacao automatica dos dados.

## Causa Raiz

1. O scraper externo processa os dados em background, mas **nao atualiza o `status` nem o `last_run_at`** da fonte na base de dados apos concluir.
2. A pagina nao faz polling nem usa realtime para detetar quando novos produtos chegam.

## Alteracoes Propostas

### 1. Atualizar status e last_run_at localmente apos sync

Quando o sync retorna sucesso, atualizar imediatamente a fonte na base de dados para dar feedback visual:

- Mudar o `status` para `"running"` e `last_run_at` para `now()` na tabela `scraper_sources` logo apos a resposta de sucesso da API.
- Re-buscar a lista de fontes (`fetchSources()`) para atualizar a tabela.

### 2. Adicionar coluna "Ultima Execucao" na tabela

Mostrar a data/hora formatada de `last_run_at` para o utilizador saber quando foi a ultima sincronizacao.

### 3. (Opcional) Polling automatico

Adicionar um `setInterval` que re-busca as fontes a cada 30 segundos enquanto houver alguma fonte com status `"running"`, para detetar quando o scraper externo termina e muda o status.

## Detalhes Tecnicos

### Ficheiro: `src/pages/Sources.tsx`

**Na funcao `handleSync`, apos `res.ok`:**

```text
await supabase
  .from("scraper_sources")
  .update({ status: "running", last_run_at: new Date().toISOString() })
  .eq("id", source.id);
fetchSources();
```

**Na tabela, adicionar coluna "Ultima Execucao":**

- Novo `<TableHead>` com texto "Ultima Execucao".
- Novo `<TableCell>` que formata `s.last_run_at` usando `date-fns` (ex: `formatDistanceToNow`), ou mostra "Nunca" se for null.

**Polling (opcional):**

- Usar `useEffect` com `setInterval` de 30s que chama `fetchSources()` se alguma fonte tiver status `"running"`.
- Limpar o intervalo no cleanup do effect.

