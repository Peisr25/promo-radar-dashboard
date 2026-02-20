

# Corrigir Geracao de Mensagens com IA

## Problema Identificado

A funcao `generate-promo-message` esta falhando silenciosamente porque o modelo `openai/gpt-5-nano` nao suporta o parametro `temperature: 0.9` (apenas o valor padrao 1 e aceite). A API retorna erro 400 em ambas as tentativas, e o sistema cai no fallback com a frase generica "PROMOCAO IMPERDIVEL" sem avisar o usuario.

Erro nos logs:
```text
"Unsupported value: 'temperature' does not support 0.9 with this model.
 Only the default (1) value is supported."
```

## Alteracoes

### 1. Edge Function `supabase/functions/generate-promo-message/index.ts`

- Remover o parametro `temperature: 0.9` do body da requisicao (o modelo usara o valor padrao 1, que ja e suficiente para criatividade).
- Trocar o modelo de `openai/gpt-5-nano` para `google/gemini-3-flash-preview` (modelo recomendado, mais capaz e sem restricoes de temperatura).

### 2. Frontend `src/pages/Pipeline.tsx`

- Na funcao `generateMessage` (linha 169-182), verificar se a resposta da edge function contem um indicador de fallback e exibir um toast de aviso ao usuario quando a IA falhar e o titulo padrao for usado.

## Detalhes Tecnicos

### Edge Function - Corpo da requisicao corrigido

Antes:
```text
model: "openai/gpt-5-nano"
temperature: 0.9
```

Depois:
```text
model: "google/gemini-3-flash-preview"
(sem parametro temperature)
```

### Edge Function - Sinalizar fallback ao frontend

Adicionar um campo `fallback: true` na resposta JSON quando o titulo generico for usado, para que o frontend possa avisar o usuario.

### Frontend - Aviso ao usuario

Na funcao `generateMessage`, apos receber a resposta, verificar `data?.fallback === true` e exibir um toast de aviso:
"A IA nao conseguiu gerar um titulo criativo. Foi usado o titulo padrao. Voce pode editar na aba Revisao."

