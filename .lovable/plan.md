

# Correcoes no Pipeline: Botao Gerar Copy, Encurtador de Links e Prompts da IA

## Resumo

Tres correcoes a aplicar: mover o botao "Gerar Copy" para a aba correta, integrar o encurtador de links no modal de geracao, e restringir rigorosamente o tamanho dos textos gerados pela IA.

## Alteracoes

### 1. Mover o Botao "Gerar Copy" da aba "Novos Achados" para "Revisao e IA"

**Ficheiro: `src/pages/Pipeline.tsx`**

- **Remover** o botao "Gerar Copy" dos cartoes da aba "Novos Achados" (linhas 415-417).
- **Adicionar** um botao "Gerar Copy" em cada cartao da aba "Revisao e IA", ao lado dos botoes "Regenerar" e "Copiar" (linha ~491).
- Adaptar o estado `copyModalProduct` para aceitar dados de uma `Promotion` (a aba de revisao usa o tipo `Promotion`, nao `RawScrape`). O `GenerateCopyModal` ja aceita um `ProductData` generico, bastando mapear os campos da `Promotion` para esse formato ao abrir o modal.

### 2. Integrar o Encurtador de Links no GenerateCopyModal

**Ficheiro: `src/components/pipeline/GenerateCopyModal.tsx`**

- Antes de chamar a Edge Function `generate-promo-message`, invocar `shortenLink()` para obter a URL curta do produto.
- Passar a `shortUrl` como `original_url` no body da chamada a IA, em vez da URL longa original.
- Importar `shortenLink` de `@/lib/link-shortener`.
- Tratar o caso de erro do encurtador com um toast informativo.

### 3. Ajustar o Prompt do "Modo Padrao" (Edge Function)

**Ficheiro: `supabase/functions/generate-promo-message/index.ts`**

Substituir o conteudo da funcao `buildDefaultPrompt()` pelo seguinte prompt estrito:

```text
Voce atua no WhatsApp. E ESTRITAMENTE PROIBIDO usar introducoes, saudacoes, bullet points, descricoes de funcionalidades ou emojis nao solicitados. O seu texto final deve ter no MAXIMO 5 linhas. Siga este formato exato e nao adicione NADA a mais:

[Emoji de medalha baseado no desconto] [CRIE UMA FRASE ENGRAÇADA, IRÔNICA E CURTA SOBRE O PRODUTO EM CAIXA ALTA]

[Nome original do produto em Title Case]

[Preco e parcelamento. Ex: por R$ 43,55 no PIX]
[Link Encurtado que foi fornecido]
```

### 4. Ajustar o Prompt do "Modo Personalizado" (Edge Function)

**Ficheiro: `supabase/functions/generate-promo-message/index.ts`**

Adicionar a seguinte regra ao final do prompt retornado por `buildCustomPrompt()`:

```text
REGRA DE COMPRIMENTO: O texto deve ser curto, direto ao ponto para WhatsApp (maximo de 6 linhas). Nunca use formato de lista ou descricoes longas.
```

## Detalhes Tecnicos

### Ficheiros a alterar

**`src/pages/Pipeline.tsx`**:
- Remover linhas 415-417 (botao "Gerar Copy" na aba "Novos Achados")
- Na aba "Revisao e IA" (linha ~491), adicionar botao que abre o `GenerateCopyModal` mapeando os campos da `Promotion` para o formato `ProductData`
- Ajustar o tipo de `copyModalProduct` para suportar dados vindos de `Promotion`

**`src/components/pipeline/GenerateCopyModal.tsx`**:
- Importar `shortenLink` de `@/lib/link-shortener`
- No `handleGenerate`, antes da chamada a edge function, encurtar `product.original_url` via `shortenLink()`
- Usar a URL curta resultante como `original_url` no body enviado a IA

**`supabase/functions/generate-promo-message/index.ts`**:
- Reescrever `buildDefaultPrompt()` com o prompt estrito de 5 linhas fornecido pelo utilizador
- Adicionar regra de comprimento maximo (6 linhas) ao final de `buildCustomPrompt()`

