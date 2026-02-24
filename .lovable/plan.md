

# Atualizar Pipeline de Promocoes com Dados Enriquecidos do Metadata

## Contexto

O backend de scraping foi atualizado e agora envia dados adicionais na coluna `metadata` (JSONB) da tabela `raw_scrapes`, incluindo `categoria`, `is_buy_box` e `validade_fim`. Atualmente o metadata so contem `source_id`. As alteracoes abaixo preparam a interface para os novos campos.

## Alteracoes

### 1. Atualizar a interface RawScrape (Pipeline.tsx)

Adicionar o campo `metadata` ao tipo `RawScrape`:

```text
metadata: {
  categoria?: string;
  is_buy_box?: boolean;
  validade_fim?: string;
  source_id?: string;
  [key: string]: unknown;
} | null;
```

### 2. Atualizar os Cartoes de Produto (aba "Novos Achados")

Dentro do `CardContent` de cada produto, adicionar:

- **Badge de Categoria**: Se `s.metadata?.categoria` existir, mostrar uma `Badge` com o texto da categoria.
- **Selo Open Box**: Se `s.metadata?.is_buy_box === true`, mostrar uma `Badge` vermelha/laranja com "Open Box / Reembalado".
- **Validade da Promocao**: Se `s.metadata?.validade_fim` existir, mostrar um texto com icone de relogio "Valido ate: DD/MM/AAAA HH:mm" usando `format` do `date-fns`.
- **Rating e Installments**: Remover `line-clamp` do rating e garantir que `installments` tenha espaco para textos longos (usar `text-xs` com `break-words`).

### 3. Novos Filtros (ScrapeFilters.tsx)

Adicionar dois novos filtros ao componente `ScrapeFilters`:

- **Filtro de Categoria**: Um `Select` que recebe a lista de categorias unicas extraidas dos scrapes (calculadas no `Pipeline.tsx` via `useMemo`). Permite filtrar por uma categoria especifica.
- **Filtro "Ocultar Open Box"**: Um `Checkbox` com label "Ocultar Open Box" que, quando ativo, remove itens onde `metadata?.is_buy_box === true`.

### 4. Logica de Filtragem (Pipeline.tsx)

No `useMemo` de `filteredScrapes`, adicionar:

- Filtragem por `filterCategory` (novo estado string, default `"all"`).
- Filtragem por `hideOpenBox` (novo estado boolean, default `false`).
- Calculo de categorias unicas: `useMemo` que extrai todas as `metadata?.categoria` distintas dos scrapes.

## Detalhes Tecnicos

### Ficheiros a alterar

**`src/pages/Pipeline.tsx`**:
- Adicionar `metadata` ao tipo `RawScrape`
- Importar `format` de `date-fns` e `Clock` de `lucide-react`
- Adicionar estados `filterCategory` (string) e `hideOpenBox` (boolean)
- Calcular `uniqueCategories` via `useMemo`
- Aplicar novos filtros no `filteredScrapes`
- Atualizar JSX dos cartoes com badges de categoria, selo Open Box, e validade
- Passar novos props ao `ScrapeFilters`

**`src/components/pipeline/ScrapeFilters.tsx`**:
- Adicionar props: `filterCategory`, `onFilterCategoryChange`, `categories` (string[]), `hideOpenBox`, `onHideOpenBoxChange`
- Adicionar Select de categorias e Checkbox "Ocultar Open Box"
- Incluir novos filtros na logica de `hasFilters` e `clearFilters`

### Tratamento de metadata nulo

Todo o acesso ao metadata usa optional chaining (`s.metadata?.categoria`), garantindo compatibilidade com produtos antigos que tenham metadata nulo ou sem os novos campos.

