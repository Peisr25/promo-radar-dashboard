

## 3 Correções de UI na Landing Page

### 1. Marquee de Lojas - Cores com Grayscale

Adicionar cores específicas por loja no array `stores` e aplicar `grayscale hover:grayscale-0` com a cor de texto correta em cada item.

- Atualizar o array `stores` para incluir uma propriedade `color` (ex: `text-orange-500` para Shopee, `text-blue-500` para Magalu, `text-yellow-500` para MercadoLivre, `text-red-500` para Americanas, `text-[#FF9900]` para Amazon)
- Remover a classe `opacity-50 hover:opacity-100` do container pai (linha 152) que sobrepõe o efeito
- Garantir que cada `<span>` do item tenha `grayscale hover:grayscale-0 transition-all duration-300` junto com a cor específica

### 2. Linha Conectora - Posicionamento

Na seção "Tecnologia a favor do seu bolso", alterar a posição vertical da linha decorativa.

- Linha 174: Mudar `top-[60px]` para `top-10` (40px = metade de h-20/80px = centro do ícone)

### 3. Cards de Canais - Efeito Glassmorphism

Nos cards não-highlighted da seção "Canais Segmentados", substituir as classes de fundo para recriar o efeito `.card-glass`.

- Linha 214: Substituir `border border-border/10 bg-card/5 backdrop-blur hover:border-secondary/40` por `bg-white/5 backdrop-blur-md border border-white/10 hover:border-secondary/40`

### Detalhes técnicos

Ficheiro afetado: `src/pages/LandingPage.tsx`

**Stores array** (linhas 5-14): Adicionar campo `color`:
```text
{ icon: "shopping_cart", name: "amazon", color: "text-[#FF9900]" },
{ icon: "shopping_bag", name: "Shopee", color: "text-orange-500" },
{ icon: "storefront", name: "Magalu", color: "text-blue-500" },
{ icon: "handshake", name: "MercadoLivre", color: "text-yellow-500" },
{ icon: "local_mall", name: "Americanas", color: "text-red-500" },
```

**Marquee container** (linha 152): Remover `opacity-50 transition-opacity duration-500 hover:opacity-100`, manter apenas `overflow-hidden whitespace-nowrap`.

**Marquee item** (linha 155): Adicionar `${s.color}` ao className para aplicar a cor por loja.

**Linha conectora** (linha 174): `top-[60px]` -> `top-10`.

**Cards normais** (linha 214): `border border-border/10 bg-card/5 backdrop-blur` -> `bg-white/5 backdrop-blur-md border border-white/10`.
