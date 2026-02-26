
## Correcao do botao Auto-Categorizar para Amazon

### Problema
A funcao `isGenericCategory` recebe apenas uma string (`categoria`), determinada por `metadata?.categoria ?? s.metadata?.amazon_category`. Como o scraper da Amazon define sempre `metadata.categoria = "Amazon Ofertas"`, o operador `??` nunca chega a avaliar `amazon_category`. A string `"Amazon Ofertas"` tem espaco, falha no regex `/^[a-z0-9_]+$/i`, e o sistema conclui que o produto ja esta categorizado -- escondendo o botao.

### Solucao
Alterar a funcao `isGenericCategory` para receber o objeto `metadata` inteiro em vez de uma unica string, e ajustar o `useMemo` correspondente.

### Alteracoes

**Arquivo: `src/pages/Pipeline.tsx` (linhas 152-165)**

Substituir a funcao e o useMemo por:

```typescript
const isGenericCategory = (source: string | null, metadata: any) => {
  if (!metadata) return true;
  
  if (source === "shopee") {
    return !metadata.categoria || metadata.categoria === "Shopee Geral";
  }
  
  if (source === "amazon") {
    if (metadata.categoria === "Amazon Ofertas") return true;
    if (metadata.amazon_category && /^[a-z0-9_]+$/i.test(metadata.amazon_category)) return true;
  }
  
  return false;
};

const uncategorizedProducts = useMemo(() => {
  return scrapes.filter(s =>
    (s.source === "shopee" || s.source === "amazon") &&
    isGenericCategory(s.source, s.metadata)
  );
}, [scrapes]);
```

### Detalhes tecnicos
- A funcao agora avalia `metadata.categoria` e `metadata.amazon_category` separadamente para Amazon
- Para Shopee, mantem a logica existente (sem categoria ou "Shopee Geral")
- Para Amazon, trata dois cenarios: categoria generica em portugues ("Amazon Ofertas") e categoria nativa em ingles com underscores
- Nenhuma outra alteracao necessaria -- a Edge Function `auto-categorize` ja suporta ambas as fontes
