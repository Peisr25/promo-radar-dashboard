

## Plano: Descricao Padrao + Edicao em Massa de Descricoes

### O que sera feito

1. **Nova coluna no banco de dados** -- Adicionar `default_group_description` (text) na tabela `settings` com valor padrao sendo o texto fornecido.

2. **Campo na pagina de Configuracoes** (`/admin/settings`) -- Novo card "Descricao Padrao dos Grupos" com um Textarea para editar a descricao padrao. O campo vem pre-preenchido com o texto fornecido.

3. **Botao de acao em massa na pagina WhatsApp** (`/admin/whatsapp`) -- Quando houver grupos selecionados, um novo botao "Alterar Descricoes" aparece na barra de acoes em massa. Ao clicar:
   - Abre um modal com a descricao padrao carregada das configuracoes do utilizador
   - Permite editar antes de aplicar
   - Ao confirmar, percorre todos os grupos selecionados e:
     - Chama `updateGroupDescription()` (Evolution API) para atualizar no WhatsApp
     - Atualiza `group_description` na tabela `whatsapp_groups` no banco
   - Mostra progresso (X de Y) e resultado final

---

### Detalhes Tecnicos

**Migracao SQL:**
```sql
ALTER TABLE public.settings
ADD COLUMN default_group_description text DEFAULT 'Seja bem-vindo(a) ao Radar das Promos! ...';
```

**Settings.tsx:**
- Adicionar `default_group_description` ao state do formulario
- Carregar e salvar junto com os outros campos
- Novo Card com Textarea (rows=12)

**WhatsAppSettings.tsx:**
- Novo state: `bulkDescOpen`, `bulkDescText`, `bulkDescSaving`, `bulkDescProgress`
- Funcao `loadDefaultDescription()` que busca da tabela `settings`
- Funcao `saveBulkDescriptions()` que itera sobre `selectedIds`, chamando `updateGroupDescription()` para cada grupo com delay de 2s entre chamadas (anti-spam)
- Atualiza `group_description` no banco apos cada sucesso
- Novo botao "Alterar Descricoes" na barra de bulk actions
- Modal com Textarea editavel + barra de progresso

**Arquivos modificados:**
- `src/pages/Settings.tsx` -- novo campo
- `src/pages/WhatsAppSettings.tsx` -- novo botao + modal de edicao em massa
- Migracao SQL -- nova coluna
