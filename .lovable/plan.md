
# Integrar Motor de Web Scraping Externo na Pagina de Fontes

## Resumo

Adicionar o campo `site_name` (identificador do site, ex: "magalu") a cada fonte e um botao de sincronizacao que dispara o scraper externo via API.

## Alteracoes

### 1. Migracao de Base de Dados

Adicionar a coluna `site_name` (text, nullable, default null) a tabela `scraper_sources`:

```text
ALTER TABLE public.scraper_sources ADD COLUMN site_name text DEFAULT NULL;
```

Isto e necessario porque a coluna nao existe atualmente. Ao ser nullable com default null, nao quebra registos existentes.

### 2. Atualizar `src/pages/Sources.tsx`

**Estado e formulario:**
- Adicionar `site_name: ""` ao estado inicial do `form`.
- Na funcao `openNew`, inicializar `site_name: ""`.
- Na funcao `openEdit`, preencher `site_name: s.site_name || ""`.

**Novo estado `syncingId`:**
- Criar `const [syncingId, setSyncingId] = useState<string | null>(null)` para controlar o loading do botao de sync.

**Nova funcao `handleSync(source: Source)`:**
- Define `syncingId` com o id da fonte.
- Faz `fetch("https://fast-api-scrapers-radar-production.up.railway.app/api/start-scrape", { method: "POST", headers, body: { source_id, site_name } })`.
- Se `res.ok`, mostra toast de sucesso: "Sincronizacao iniciada em background! Os produtos aparecerao em breve."
- Se falhar, mostra toast de erro.
- No final, limpa `syncingId` para null.

**Formulario (Dialog):**
- Adicionar um novo `<Input>` com placeholder "Identificador do site (ex: magalu)" entre o campo Nome e o campo URL.

**Tabela (coluna Acoes):**
- Adicionar um botao antes do botao Editar com icone `RefreshCw` (ou `Loader2` com `animate-spin` quando `syncingId === s.id`).
- Importar `RefreshCw` de `lucide-react`.

**Importacoes:**
- Adicionar `RefreshCw` a importacao de `lucide-react`.

### 3. Tipos TypeScript

O ficheiro `src/integrations/supabase/types.ts` sera atualizado automaticamente apos a migracao, adicionando `site_name` ao tipo `scraper_sources`. Ate la, o acesso via `s.site_name` pode precisar de um cast ou do operador optional chaining, que ja esta coberto com `s.site_name || ""`.
