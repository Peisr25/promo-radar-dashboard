

# Correcao do Endpoint Shopee no start-scrape

## Problema
O bloco de fetch da Shopee (linhas 62-69) usa a URL errada (`/api/scrape/shopee`) e envia um payload que nao passa na validacao Pydantic do backend FastAPI.

## Correcao
Substituir linhas 62-68 para usar o endpoint unificado `/api/start-scrape` com o payload correto:

```text
// De (errado):
URL: /api/scrape/shopee
body: { app_id, app_secret, user_id }

// Para (correto):
URL: /api/start-scrape
body: { source_id: "shopee_api_source", site_name: "shopee", app_id, app_secret }
```

## Ficheiro alterado
| Ficheiro | Alteracao |
|---|---|
| `supabase/functions/start-scrape/index.ts` | Linhas 62-68: corrigir URL e payload do fetch Shopee |

## Apos edicao
Redeploy automatico da Edge Function `start-scrape`.

