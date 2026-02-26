

# Separar Visualmente o Bloco de Urgencia no Prompt da IA

## Problema
A IA esta a misturar a frase de humor/gancho com o texto de escassez no mesmo paragrafo, prejudicando a leitura no WhatsApp.

## Solucao
Atualizar os prompts em `buildDefaultPrompt()` e `buildCustomPrompt()` para definir uma estrutura de blocos obrigatoria, e reformular a injecao de escassez para instruir a IA a criar um paragrafo ISOLADO.

## Alteracoes

### Ficheiro: `supabase/functions/generate-promo-message/index.ts`

**1. `buildDefaultPrompt()` (linhas 15-31)** -- Reformular a estrutura do formato para incluir o bloco de urgencia como item separado:

```text
ESTRUTURA OBRIGATÓRIA (cada bloco separado por linha em branco):

BLOCO 1 - GANCHO: [Emoji medalha] [FRASE ENGRAÇADA EM CAIXA ALTA]

BLOCO 2 - TÍTULO: [Nome do produto em Title Case]

BLOCO 3 - URGÊNCIA (APENAS se indicado): Parágrafo isolado com emojis ⚡ ou ⏳ sobre escassez.

BLOCO 4 - PREÇO: Bloco de preço com formatação WhatsApp (~antigo~ por *novo*)
```

Adicionar regra explicita: "NUNCA misture o texto de urgencia/escassez no mesmo paragrafo da frase de humor inicial. A urgencia deve ser SEMPRE um bloco visual separado."

**2. `buildCustomPrompt()` (linhas 33-78)** -- Adicionar a mesma instrucao de estrutura em blocos e a regra de separacao.

**3. Injecao de escassez (linhas 137-143)** -- Reformular `scarcityInstruction` para instruir explicitamente a IA a criar um paragrafo ISOLADO entre o titulo e o preco:

```text
BLOCO DE URGÊNCIA OBRIGATÓRIO: Crie um parágrafo ISOLADO (separado por linhas em branco)
dedicado APENAS à escassez. Use emojis ⚡ ou ⏳.
Exemplo: '⚡ OFERTA RELÂMPAGO: Já temos 84% vendido, corre que tá acabando!'
NUNCA misture este texto com a frase de humor do gancho.
```

### Resumo das alteracoes

| Local | O que muda |
|---|---|
| `buildDefaultPrompt()` | Formato reestruturado em 4 blocos explicitos com instrucao de separacao |
| `buildCustomPrompt()` | Mesma instrucao de estrutura em blocos adicionada |
| Bloco de scarcity (linha 137-143) | Instrucao reescrita para forcar paragrafo ISOLADO entre titulo e preco |

Apenas o ficheiro `supabase/functions/generate-promo-message/index.ts` sera alterado. A funcao sera reimplantada automaticamente.
