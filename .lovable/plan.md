

## Sublinhado Dinamico nos Links do Cabecalho

### Problema
Atualmente, apenas "Tecnologia" tem o sublinhado ativo (bold + borda secundaria) fixo no cabecalho da Landing Page. Ao clicar em "Inicio" ou "Seguranca", o sublinhado nao muda — ele permanece sempre em "Tecnologia".

### Solucao
Implementar um estado ativo dinamico baseado na posicao de scroll da pagina. Quando o usuario estiver no topo, "Inicio" fica ativo. Quando a secao `#tecnologia` estiver visivel, "Tecnologia" fica ativo. Quando `#confianca` estiver visivel, "Seguranca" fica ativo.

### Alteracoes em `src/pages/LandingPage.tsx`

1. **Adicionar estado e efeito de scroll**:
   - Criar um estado `activeSection` (valores: `"inicio"`, `"tecnologia"`, `"confianca"`)
   - Adicionar um `useEffect` com `IntersectionObserver` ou listener de scroll que detecta qual secao esta visivel e atualiza o estado
   - Logica: se scroll esta no topo (< 200px), ativo = "inicio". Se secao `#confianca` esta visivel, ativo = "confianca". Se secao `#tecnologia` esta visivel, ativo = "tecnologia". Fallback = "inicio".

2. **Aplicar classes condicionalmente nos links**:
   - Cada link recebe a classe ativa (`text-foreground font-bold border-b-2 border-secondary pb-0.5`) apenas quando `activeSection` corresponde ao seu valor
   - Caso contrario, usa a classe inativa (`text-muted-foreground hover:text-foreground`)

3. **Ao clicar**, o scroll leva a secao correspondente e o observer atualiza o sublinhado automaticamente.

### Secao Tecnica

**Ficheiro alterado:** `src/pages/LandingPage.tsx`

```text
Pseudo-codigo do efeito:

const [activeSection, setActiveSection] = useState("inicio");

useEffect(() => {
  const handleScroll = () => {
    const scrollY = window.scrollY;
    const techSection = document.getElementById("tecnologia");
    const trustSection = document.getElementById("confianca");

    if (trustSection && scrollY >= trustSection.offsetTop - 150) {
      setActiveSection("confianca");
    } else if (techSection && scrollY >= techSection.offsetTop - 150) {
      setActiveSection("tecnologia");
    } else {
      setActiveSection("inicio");
    }
  };
  window.addEventListener("scroll", handleScroll);
  handleScroll(); // initial check
  return () => window.removeEventListener("scroll", handleScroll);
}, []);
```

Cada link usa:
```text
className={activeSection === "inicio"
  ? "text-sm text-foreground font-bold border-b-2 border-secondary pb-0.5"
  : "text-sm text-muted-foreground hover:text-foreground transition-colors"
}
```

Nenhum outro ficheiro precisa ser alterado. A pagina /grupos mantem o sublinhado fixo em "Grupos" como esta.
