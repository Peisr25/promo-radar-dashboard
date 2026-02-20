

# Adicionar Espacamento na Mensagem Gerada pela IA

## Problema

A mensagem gerada pela IA fica com todas as linhas juntas, sem separacao visual entre o titulo criativo, o titulo do produto, o preco e o link. Isso dificulta a leitura no WhatsApp.

## Formato Atual

```
🥇 TITULO CRIATIVO DA IA
Nome do Produto Original
🎟 ~R$ 199,90~ por R$ 99,90 (*50% OFF*) no Pix
https://link.com
```

## Formato Desejado

```
🥇 TITULO CRIATIVO DA IA

Nome do Produto Original

🎟 ~R$ 199,90~ por R$ 99,90 (*50% OFF*) no Pix

https://link.com
```

## Alteracao

### Edge Function `supabase/functions/generate-promo-message/index.ts`

Trocar os `\n` simples por `\n\n` (linha em branco) na montagem da mensagem final, tanto no bloco principal (quando a IA funciona) quanto no bloco de fallback. As alteracoes serao nos dois trechos de montagem da variavel `message`:

- Apos o titulo criativo: `\n` vira `\n\n`
- Apos o titulo do produto: `\n` vira `\n\n`
- Apos a linha de preco: `\n` vira `\n\n`

