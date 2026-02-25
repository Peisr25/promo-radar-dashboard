

# Filtro por Fonte no Pipeline

## Resumo
Adicionar tabs de filtragem por fonte (Todas, Magalu, Shopee) no topo da pagina Pipeline e badges visuais nos cards de produtos.

## Alteracoes

### 1. Estado e logica de filtragem (`src/pages/Pipeline.tsx`)

- Adicionar estado `sourceFilter` com valores `"all" | "magalu" | "shopee"`, default `"all"`.
- No componente `<TabsList>` de fontes, colocar logo abaixo do titulo `<h1>` e acima das tabs existentes ("Novos Achados", "Revisao", "Fila").
- Aplicar o filtro de source no `useMemo` de `filteredScrapes` -- antes dos outros filtros, filtrar por `s.source === sourceFilter` quando nao for `"all"`.
- Atualizar a contagem exibida nas tabs existentes para refletir o filtro de fonte ativo.

### 2. Tabs de fonte (UI)

```text
[Todas as Fontes (123)] [Magalu (80)] [Shopee (43)]
```

Usar o componente `<Tabs>` com `onValueChange` (modo controlado) em vez de `defaultValue`, para manter o estado no componente pai. As tabs de fonte ficam separadas das tabs de etapas do pipeline.

### 3. Badge de identificacao visual nos cards

No bloco de badges existente (linha ~379-386), adicionar um `<Badge>` com a fonte:
- `source === "magalu"` -- fundo azulado (`bg-blue-100 text-blue-700`)
- `source === "shopee"` -- fundo alaranjado (`bg-orange-100 text-orange-700`)
- Outras fontes -- badge neutro com o nome da fonte

### Ficheiros alterados

| Ficheiro | Alteracao |
|---|---|
| `src/pages/Pipeline.tsx` | Adicionar estado `sourceFilter`, tabs de fonte no topo, filtro no `useMemo`, badges de fonte nos cards |

Nenhuma alteracao a base de dados ou a componentes filhos e necessaria -- tudo e resolvido dentro do Pipeline.tsx.

