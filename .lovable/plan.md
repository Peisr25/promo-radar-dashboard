

## Tornar a pagina /grupos funcional

### Problemas atuais
- Os botoes de categoria (pills) nao fazem nada ao clicar - o estado ativo esta fixo no primeiro item (index === 0)
- Os cards de grupos nao tem uma propriedade de categoria para filtrar
- Os botoes "Entrar Agora" / "Avisar Vaga" nao tem acao

### Mudancas planejadas

**1. Filtro de categorias funcional**
- Adicionar `useState` para controlar a categoria selecionada (default: "Todos")
- Adicionar campo `category` a cada grupo no array `groups` mapeando para as categorias existentes (Tech, Casa, Moda, Geek, Kids, Relampago)
- Ao clicar num pill, atualizar o estado e filtrar os cards exibidos
- "Todos" mostra todos os grupos

**2. Botoes de acao nos cards**
- "Entrar Agora" abre um link externo do WhatsApp (placeholder `https://chat.whatsapp.com/...`) em nova aba
- "Avisar Vaga" (lista de espera) mostra um toast de confirmacao usando sonner

**3. Newsletter funcional**
- Adicionar validacao basica do email e toast de sucesso ao submeter

### Detalhes tecnicos

Arquivo alterado: `src/pages/Groups.tsx`

- Importar `useState` do React e `toast` do sonner
- Cada objeto em `groups` recebe `category: string` (ex: "Tech", "Casa", "Moda", "Geek", "Relâmpago", "Kids")
- Estado: `const [activeCategory, setActiveCategory] = useState("Todos")`
- Filtragem: `const filtered = activeCategory === "Todos" ? groups : groups.filter(g => g.category === activeCategory)`
- Pills usam `activeCategory === cat.label` para estilo ativo em vez de `i === 0`
- Botao CTA: grupos com status "Vagas Abertas" ou "Ultimas Vagas" abrem link WhatsApp; grupos com "Lista de Espera" disparam `toast.success("Voce sera avisado quando abrir vaga!")`
- Newsletter: estado para email, validacao basica, toast de confirmacao
