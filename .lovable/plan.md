
## Corrigir navegacao de /grupos para secoes da Landing Page

### Problema
Ao clicar em "Seguranca" ou "Tecnologia" na pagina /grupos, o site navega para a Landing Page mas nao rola ate a secao correspondente. Isso acontece porque o React Router intercepta a navegacao e renderiza o componente sem executar o scroll nativo do browser para o hash (#confianca, #tecnologia).

### Solucao
Adicionar um `useEffect` na Landing Page que detecta o hash na URL ao montar o componente e faz scroll automatico ate o elemento correspondente.

### Alteracoes em `src/pages/LandingPage.tsx`

Adicionar um novo `useEffect` que:
1. Le `window.location.hash` ao montar
2. Se houver hash (ex: `#confianca`), busca o elemento com esse id
3. Usa `scrollIntoView` com um pequeno delay (para garantir que o DOM esta pronto)

```text
useEffect(() => {
  const hash = window.location.hash;
  if (hash) {
    setTimeout(() => {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }
}, []);
```

Nenhum outro ficheiro precisa ser alterado. Os links em `/grupos` ja usam `<a href="/#confianca">` corretamente.
