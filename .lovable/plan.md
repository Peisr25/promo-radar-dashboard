

## Corrigir Cabecalho da Landing Page

### Problema
O cabecalho (navbar) da Landing Page esta diferente do cabecalho da pagina /grupos:
1. **Estilo diferente**: A Landing Page usa `h-20`, `border-border/10`, `bg-background/30`, logo com borda extra, e botao com estilo custom. A pagina /grupos usa `h-16`, `border-border/50`, `bg-background/80`, logo simples, e botao com `variant="outline"`.
2. **Falta o link "Inicio"**: A Landing Page nao tem o hiperlink "Inicio" que existe em /grupos.
3. **Anchors incorretos**: O link "Tecnologia" na /grupos aponta para `/#tech` mas o id na Landing Page e `id="tecnologia"`. O link "Seguranca" aponta para `/#stats` mas o id e `id="confianca"`.

### Alteracoes

#### 1. Substituir o cabecalho da Landing Page (`src/pages/LandingPage.tsx`)

Trocar o bloco `<header>` atual (linhas ~79-95) pelo mesmo padrao usado em /grupos:

- Mudar de `<header>` para `<nav>` com classes `fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl`
- Container interno: `h-16` em vez de `h-20`, com `px-4 sm:px-6`
- Logo: botao simples com `rounded-lg bg-secondary/20` (sem borda extra)
- Links de navegacao:
  - Adicionar "Inicio" apontando para `/`
  - "Tecnologia" com link ativo (bold + border-bottom secondary, pois estamos na landing)
  - "Grupos" apontando para `/grupos`
  - "Seguranca" apontando para `#confianca`
- Botao "Entrar": usar `Button` com `variant="outline"` e classes `border-secondary/30 text-secondary hover:bg-secondary/10`

#### 2. Corrigir os anchor IDs ou os links

Duas opcoes - vou alinhar os links com os IDs existentes na Landing Page:
- "Tecnologia" linkar para `#tecnologia` (ID ja existe na landing page)
- "Seguranca" linkar para `#confianca` (ID ja existe na landing page)
- Atualizar tambem os links em /grupos para usar `/#tecnologia` e `/#confianca` em vez de `/#tech` e `/#stats`

### Secao Tecnica

**Ficheiros alterados:**
- `src/pages/LandingPage.tsx` - substituir bloco do header pelo padrao de /grupos, adicionar import do `Button`
- `src/pages/Groups.tsx` - corrigir anchors de `/#tech` para `/#tecnologia` e `/#stats` para `/#confianca`

