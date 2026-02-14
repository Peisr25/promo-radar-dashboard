

# Corrigir Bugs na Geracao de Mensagens do Pipeline

## Problema
A mensagem gerada pela IA tem 3 bugs: (1) falta linha "De/Por" com precos, (2) link original usado no regenerar em vez do encurtado, (3) formato de precos inconsistente.

## Alteracoes

### 1. Edge Function `generate-promo-message/index.ts`

Atualizar a construcao da mensagem (linhas 87-96) para:
- Mostrar "De R$ X por R$ Y (X% OFF)" quando houver `old_price`
- Formatar precos com virgula (padrao brasileiro)
- Manter a linha "Por R$ X no Pix" com preco formatado

**Antes:**
```
medal + TITULO
produto
Desconto de X% aplicado automaticamente
Por 256.39 no Pix
link
```

**Depois:**
```
medal + TITULO
produto
De R$ 399,90 por R$ 256,39 (36% OFF)
Por R$ 256,39 no Pix
link
```

### 2. Pipeline.tsx - Regenerar Mensagem (linha ~369)

Atualizar o botao "Regenerar" para usar o link encurtado em vez do `product_url` original:
- Construir a short URL a partir de `p.short_link_code` quando disponivel
- Passar `price_type` (que nao estava sendo passado)

**Antes:** `original_url: p.product_url ?? ""`
**Depois:** `original_url: p.short_link_code ? \`\${window.location.origin}/r/\${p.short_link_code}\` : p.product_url ?? ""`

---

## Detalhes Tecnicos

### Edge Function - Mudancas na construcao da mensagem:

```typescript
// Formatar precos no padrao brasileiro
const formatBRL = (v: number) => v.toFixed(2).replace(".", ",");

let message = `${medal} ${creativeTitle}\n`;
message += `${product_title}\n`;

if (old_price && discount > 0) {
  const formattedOld = formatBRL(Number(old_price));
  message += `🎟 De R$ ${formattedOld} por R$ ${formatBRL(Number(price))} (${discount}% OFF)\n`;
}

message += `Por R$ ${formattedPrice} ${priceType}\n`;

if (original_url) {
  message += original_url;
}
```

### Pipeline.tsx - Regenerar com link curto:

```typescript
const shortUrl = p.short_link_code
  ? `${window.location.origin}/r/${p.short_link_code}`
  : p.product_url ?? "";

const msg = await generateMessage({
  product_title: p.product_name,
  price: p.promo_price ?? 0,
  old_price: p.original_price,
  discount_percentage: ...,
  price_type: null, // nao temos price_type na tabela promotions
  original_url: shortUrl,
});
```

### Ficheiros afetados:
1. `supabase/functions/generate-promo-message/index.ts` - corrigir template da mensagem
2. `src/pages/Pipeline.tsx` - corrigir regenerar para usar link curto

