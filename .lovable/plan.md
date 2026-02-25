

# Correcao do Dominio nos Links Encurtados

## Problema

O encurtador de links usa `window.location.origin` para construir a URL curta. Quando voce trabalha no ambiente de preview, o `origin` retorna `https://3dc35a41-...lovableproject.com`, e esse dominio errado fica gravado na mensagem da IA e na base de dados.

O correto seria usar sempre o dominio publicado: `https://radardaspromos.lovable.app`.

## Solucao

Substituir `window.location.origin` por uma constante com o dominio publicado no ficheiro `src/lib/link-shortener.ts`. Em vez de depender do browser, o sistema usara sempre o dominio correto.

## Detalhes Tecnicos

### Ficheiro a alterar: `src/lib/link-shortener.ts`

- Criar uma constante no topo do ficheiro:
  ```text
  const BASE_URL = "https://radardaspromos.lovable.app";
  ```
- Substituir as duas ocorrencias de `${window.location.origin}/r/` por `${BASE_URL}/r/` (linhas 33 e 56).

### Ficheiro a alterar: `src/pages/Pipeline.tsx`

- Verificar se `handleProcess` ou `handleRegenerate` tambem usam `window.location.origin` para construir links. Se sim, aplicar a mesma correcao.

Nenhuma alteracao de base de dados e necessaria. Os links ja salvos com o dominio errado so serao corrigidos ao regenerar a mensagem.

