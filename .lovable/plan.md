

## Criar pagina "Como Funciona" e atualizar rodape das paginas publicas

### 1. Criar nova pagina `src/pages/HowItWorks.tsx`

Baseada no HTML de referencia (`code-2.html`) e no screenshot, a pagina tera as seguintes secoes:

- **Hero**: Badge "Tecnologia Exclusiva", titulo "Como Funciona o Radar IA" com gradiente purple-to-green, subtitulo descritivo
- **3 Cards de Features**: Previsao de Preco, Filtro de Falsas Promos, Alerta Ultrarrapido - cada um com imagem de fundo (Unsplash), icone circular com glow, titulo e descricao
- **Ciclo da Economia Inteligente**: Layout split - lado esquerdo com 3 steps numerados (Crawling, Analise & Validacao, Disparo), lado direito com imagem circular animada (bordas girando)
- **Seguranca e Confianca**: Grid 2x2 com cards de Protecao de Dados, Links Verificados, Transparencia Total, Suporte Humano - cada um com icone colorido diferente
- **CTA Final**: Icone rocket, titulo "Comece a economizar agora", botao verde neon "Entrar no Grupo VIP Gratis"

### 2. Adicionar rota no `src/App.tsx`

- Nova rota: `/como-funciona` renderizando `HowItWorks`

### 3. Linkar botao "Como funciona a IA" na landing page

- No `src/pages/LandingPage.tsx`, o botao ghost "Como funciona a IA" passara a chamar `navigate("/como-funciona")`

### 4. Criar componente de rodape reutilizavel `src/components/PublicFooter.tsx`

Baseado no rodape completo do HTML de referencia, com:

- **Coluna esquerda**: Logo Radar das Promos + descricao curta
- **Coluna "Plataforma"**: Links para Como Funciona (`/como-funciona`), Nossos Grupos (`/grupos`), Blog de Ofertas (placeholder)
- **Coluna "Legal"**: Links para Termos de Uso (`/institucional#termos`), Privacidade (`/institucional#privacidade`), Contato (placeholder)
- **Barra inferior**: Copyright + Nota de Transparencia sobre comissoes de afiliado

### 5. Substituir rodape em todas as paginas publicas

Substituir o footer atual nestas paginas pelo componente `PublicFooter`:

- `src/pages/LandingPage.tsx`
- `src/pages/Groups.tsx`
- `src/pages/Institutional.tsx`
- `src/pages/HowItWorks.tsx` (ja usara o componente)

### Detalhes tecnicos

- O componente `PublicFooter` recebera `navigate` via `useNavigate` internamente
- Reutilizara o `MaterialIcon` helper (sera importado ou redefinido localmente)
- Icone `Radar` de lucide-react para o logo
- Todas as classes usam o sistema de design existente (cores CSS variables: `border`, `muted-foreground`, `secondary`, etc.)
- As imagens dos cards de features usam URLs Unsplash publicas como background com `mix-blend-luminosity` e `opacity-30`
- Animacoes de spin nas bordas do ciclo usam classes Tailwind `animate-spin` com duracao customizada via estilo inline

