

# Integrar Amazon ao Dashboard

## Resumo
Adicionar a Amazon como nova fonte de scraping na pagina Sources e como filtro no Pipeline, seguindo os padroes ja existentes para Magalu e Shopee.

## Alteracoes

### 1. Sources.tsx -- Card da Amazon

Adicionar um novo Card estatico (similar ao da Shopee mas mais simples, sem credenciais) entre o card da Shopee e a tabela de fontes genericas.

- Icone: `Package` (lucide) ou reutilizar `ShoppingBag`
- Titulo: "Amazon"
- Badge: sempre "Pronto" (nao precisa de configuracao)
- Descricao: "Motor de busca da Amazon. Sincronize para importar produtos."
- Botao "Sincronizar" que faz POST para `start-scrape` com body `{ site_name: "amazon", source_id: "amazon_api_source" }`
- Estado `amazonSyncing` para controlar loading do botao

### 2. Pipeline.tsx -- Aba Amazon no filtro de fontes

**Tipo do sourceFilter**: Alterar de `"all" | "magalu" | "shopee"` para `"all" | "magalu" | "shopee" | "amazon"` (linha 77).

**Tabs de fonte** (linhas 377-387): Adicionar nova TabsTrigger:
```text
<TabsTrigger value="amazon">
  <span>📦 Amazon ({count})</span>
</TabsTrigger>
```

### 3. Pipeline.tsx -- Badge visual Amazon nos cards de produto

Nas linhas 443-451, adicionar condicao para `source === "amazon"`:
```text
{s.source === "amazon" && (
  <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">Amazon</Badge>
)}
```

Atualizar a condicao de fallback (linha 449) para excluir tambem "amazon":
```text
{s.source && s.source !== "magalu" && s.source !== "shopee" && s.source !== "amazon" && (
```

## Ficheiros alterados

| Ficheiro | Alteracao |
|---|---|
| `src/pages/Sources.tsx` | Novo card Amazon com botao Sincronizar + estado `amazonSyncing` |
| `src/pages/Pipeline.tsx` | Tipo sourceFilter expandido, nova aba Amazon, badge amber nos cards |

Nao sao necessarias alteracoes na Edge Function `start-scrape` -- ela ja suporta o fluxo generico com `site_name` + `source_id`.

