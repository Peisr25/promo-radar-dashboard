
## Plano: Broadcast por Nicho + Painel de Copywriting

### Resumo

Transformar o sistema de automacao de "1 regra -> 1 grupo" para "1 regra -> N grupos por nicho", adicionar controles avancados de copywriting no modal, e fazer o motor de IA respeitar essas configuracoes.

---

### 1. Frontend -- AutomationRuleModal.tsx

**Remover:**
- Campo `target_group_id` (Select de grupo especifico) -- linhas 263-287
- Remover do schema Zod e dos defaultValues
- Remover query `whatsapp_groups_select` (ja nao e necessaria)

**Adicionar -- target_categories (Nichos Alvo):**
- Novo campo com checkboxes para selecionar nichos de destino (Tech, Casa, Moda, Geek, Kids, Geral, etc.)
- Buscar as categorias distintas da coluna `categories` da tabela `whatsapp_groups` (nao confundir com categorias de produtos)
- Incluir opcao "Todos os Nichos" (token `__all__`)
- Visual: badges clicaveis, mesmo padrao do campo de categorias de produto existente

**Adicionar -- Accordion "Configuracao da Mensagem (Copy)":**
- Componente Accordion com titulo "Configuracao da Mensagem (Copy)"
- Dentro do accordion, 4 controles que alimentam o campo `message_config` (JSONB):

| Controle | Tipo | Opcoes |
|---|---|---|
| Tom de Voz | Select | `urgente` (Escassez/Bug), `amigavel` (Descontrado), `profissional` (Direto) |
| Tamanho da Copy | Select | `curta` (Impacto Rapido), `detalhada` (Com especificacoes) |
| Quantidade de Emojis | Select | `alta`, `moderada`, `baixa` |
| Destacar Parcelamento | Switch | Sim / Nao |

**Atualizar schema Zod:**
- Remover `target_group_id`
- Adicionar `target_categories: z.array(z.string()).min(1)`
- Adicionar `message_config` com campos: `tone`, `copy_length`, `emoji_level`, `show_installments`

**Atualizar mutacao de INSERT:**
- Salvar `target_categories` e `message_config` no insert
- Nao enviar mais `target_group_id`

---

### 2. Edge Function -- process-automations/index.ts

**Busca dinamica de grupos por nicho:**
- Apos encontrar a regra que faz match com o scrape, em vez de buscar 1 grupo por UUID, fazer:

```text
SELECT group_id, group_name, id FROM whatsapp_groups
WHERE is_active = true
  AND categories && rule.target_categories  (overlaps)
  AND user_id = userId
```

- Se `target_categories` contiver `__all__`, buscar todos os grupos ativos do utilizador

**Enviar message_config para generate-promo-message:**
- Adicionar `rule.message_config` ao payload da chamada `generate-promo-message`

**Loop de envio multi-grupo:**
- Para cada grupo encontrado, enviar a MESMA mensagem gerada (gerar 1x, enviar Nx)
- Registar cada envio no `whatsapp_messages_log` com o `group_id` respetivo
- Incrementar `messages_sent` para cada grupo
- Respeitar delay anti-spam entre cada envio individual

**Atualizar logs:**
- Log de processamento inclui quantos grupos receberam cada mensagem
- Log final inclui total de mensagens (sent = scrapes * grupos)

---

### 3. Edge Function -- generate-promo-message/index.ts

**Receber message_config:**
- Extrair do body: `message_config` (objeto com `tone`, `copy_length`, `emoji_level`, `show_installments`)

**Novo modo `broadcast`:**
- Quando `message_config` estiver presente, construir um prompt dinamico que injeta:
  - Tom de voz mapeado (urgente/amigavel/profissional -> instrucoes em portugues)
  - Limite de linhas baseado em `copy_length` (curta: max 4 linhas, detalhada: max 8 linhas com specs)
  - Instrucao de emojis (alta: usar livremente, moderada: max 3, baixa: max 1)
  - Se `show_installments` for true, destacar parcelamento; se false, omitir
- A instrucao "NAO inclua links ou URLs" ja existe e sera mantida

**Nao alterar mecanismo de link:**
- O link ja e concatenado programaticamente no `process-automations` (linha 331)
- O `generate-promo-message` ja instrui a IA a nao gerar links
- Nenhuma mudanca necessaria neste ponto

---

### Arquivos modificados

1. `src/components/automations/AutomationRuleModal.tsx` -- UI completa
2. `supabase/functions/process-automations/index.ts` -- broadcast multi-grupo + message_config
3. `supabase/functions/generate-promo-message/index.ts` -- novo modo broadcast com message_config

### Nenhuma migracao de schema necessaria

As colunas `target_categories` e `message_config` ja existem na tabela `automation_rules`.
