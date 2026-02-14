

# Implementar Pagina "Links Encurtados" com Melhorias na Tabela

## Contexto
A tabela `short_links` existe mas faltam colunas importantes (`product_title`, `source`, `is_active`, `last_clicked_at`). Vamos adicionar essas colunas, atualizar a funcao de criacao de links, e criar a pagina completa de gestao.

---

## Alteracoes

### 1. Migracao SQL - Adicionar colunas faltantes

Adicionar as seguintes colunas a tabela `short_links`:
- `product_title` (TEXT) - titulo do produto para exibicao direta
- `source` (TEXT) - fonte do produto (ex: "magalu")
- `is_active` (BOOLEAN, default TRUE) - controle de ativacao/desativacao
- `last_clicked_at` (TIMESTAMPTZ) - data do ultimo clique

Criar indices para `is_active` e `source`.

Atualizar a funcao/trigger de tracking de cliques para tambem atualizar `last_clicked_at` na tabela `short_links`.

Adicionar politica RLS para UPDATE na tabela `short_links` (necessaria para ativar/desativar) e DELETE (necessaria para excluir).

### 2. link-shortener.ts - Aceitar e salvar novos campos

Expandir os parametros de `shortenLink()` para aceitar `productTitle` e `source`, e passa-los no insert.

### 3. Pipeline.tsx - Enviar titulo e fonte ao encurtar

Atualizar a chamada a `shortenLink()` no `processPromotion` para incluir `productTitle` e `source` do scrape.

### 4. ShortLinks.tsx - Criar pagina completa (novo ficheiro)

Pagina com:
- 4 cards de estatisticas: Total de Links, Total de Cliques, Media Cliques/Link, Links Ativos
- Tabela com colunas: Produto, Link Curto (com botao copiar), Cliques, Ultimo Clique, Fonte, Status (Ativo/Inativo), Data de Criacao, Acoes
- Acoes: Abrir original, Ativar/Desativar toggle, Excluir
- Query direta a `short_links` sem necessidade de JOIN (pois `product_title` estara na tabela)

### 5. AppSidebar.tsx - Adicionar item no menu

Adicionar "Links Encurtados" com icone `Link2` entre "Scraper Logs" e "Configuracoes".

### 6. App.tsx - Adicionar rota /links

Registar a rota `/links` dentro do `DashboardLayout`.

---

## Detalhes Tecnicos

- A migracao adiciona colunas com IF NOT EXISTS para seguranca
- O trigger `increment_click_count` que ja pode existir na funcao `click_logs` sera substituido por uma versao que tambem atualiza `last_clicked_at`
- Politicas RLS de UPDATE e DELETE serao restritas ao `user_id = auth.uid()`
- A pagina ShortLinks usa query simples: `supabase.from("short_links").select("*").order("created_at", { ascending: false })`
- Links sem `product_title` (criados antes da migracao) exibem URL truncada como fallback

