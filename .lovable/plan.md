
# Corrigir link encurtado na mensagem gerada pela IA

## Problema
A Edge Function `generate-promo-message` recebe o `original_url` (ja encurtado pelo frontend) mas so o adiciona a mensagem no caso de **fallback** (quando a IA falha). Quando a IA gera a mensagem com sucesso (linha 195-198), o link e simplesmente ignorado -- a funcao retorna apenas o texto da IA sem o URL.

Isto afeta todas as fontes (Magalu e Shopee), mas pode ter passado despercebido se as mensagens eram editadas manualmente antes do envio.

## Correcao

### Ficheiro: `supabase/functions/generate-promo-message/index.ts`

Nas linhas 194-198, apos obter a resposta da IA, concatenar o `original_url` ao final da mensagem:

```text
// De (atual):
const message = data.choices?.[0]?.message?.content?.trim() ?? "...";
return new Response(JSON.stringify({ message }), ...);

// Para (corrigido):
const aiText = data.choices?.[0]?.message?.content?.trim() ?? "...";
const message = original_url ? `${aiText}\n\n${original_url}` : aiText;
return new Response(JSON.stringify({ message }), ...);
```

Isto garante que o link encurtado (ex: `https://radardaspromos.lovable.app/r/AbCdEf`) aparece sempre no final da mensagem gerada, independentemente da fonte ou do modo utilizado.

### Ficheiros alterados

| Ficheiro | Alteracao |
|---|---|
| `supabase/functions/generate-promo-message/index.ts` | Linhas 194-198: concatenar `original_url` ao texto da IA |

### Apos edicao
Redeploy automatico da Edge Function `generate-promo-message`.
