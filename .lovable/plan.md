

## Atualizar WhatsAppSettings com Edição de Grupos

### 1. Modal de Edição de Grupo (novo)

Adicionar estado `editGroup` e `editDialogOpen`. Ao clicar no botão de lápis, preencher o estado com os dados do grupo selecionado. O modal conterá:

- **Nome e ID** (apenas leitura, exibidos como texto)
- **Link de Convite** (`invite_link`) - campo Input
- **Categorias** (`categories`) - lista de Badges clicáveis com as opções: `['Tech', 'Casa', 'Moda', 'Geek', 'Kids', 'Beleza', 'Geral']`. Clicar alterna a seleção (toggle). Badges selecionados ficam com `bg-primary text-primary-foreground`, não selecionados ficam `variant="outline"`.
- **Apenas Ofertas Relâmpago** (`is_flash_deals_only`) - Switch toggle
- Botão Salvar que faz `update` no Supabase nos campos `invite_link`, `categories`, `is_flash_deals_only` e recarrega a lista

### 2. Nova coluna "Nichos" na tabela

- Adicionar `<TableHead>Nichos</TableHead>` entre "Último Envio" e "Status"
- Na célula, mapear `g.categories` como pequenos Badges (`variant="secondary"`, tamanho pequeno)
- Se `g.is_flash_deals_only` for true, mostrar um Badge vermelho com icone de raio ao lado do nome do grupo na primeira coluna

### 3. Botão Editar na tabela

- Adicionar icone `Pencil` (de lucide-react) como botão ghost ao lado do botão Trash2 existente
- Ao clicar, abre o modal de edição preenchido com os dados do grupo

### 4. Modal Adicionar - campo invite_link

- Expandir o estado `newGroup` para incluir `invite_link: ""`
- Adicionar campo Input "Link de Convite (opcional)" no modal de adição existente

### Detalhes técnicos

**Ficheiro:** `src/pages/WhatsAppSettings.tsx`

**Novos imports:** `Pencil, Zap` de lucide-react, `Switch` de `@/components/ui/switch`

**Novos estados:**
```text
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [editGroup, setEditGroup] = useState<any>(null);
```

**Constante de categorias:**
```text
const CATEGORY_OPTIONS = ['Tech', 'Casa', 'Moda', 'Geek', 'Kids', 'Beleza', 'Geral'];
```

**Função saveEditGroup:**
- Faz `supabase.from("whatsapp_groups").update({ categories, invite_link, is_flash_deals_only }).eq("id", editGroup.id)`
- Fecha o modal e recarrega a lista

**Função toggleCategory (dentro do modal de edição):**
- Se a categoria já está no array, remove. Senão, adiciona.

**Tabela - coluna Nome (linha 244):**
- Mostrar Badge vermelho com Zap se `g.is_flash_deals_only`

**Tabela - nova coluna Nichos (após Último Envio):**
- Mapear `(g.categories || []).map(c => <Badge variant="secondary" ...>{c}</Badge>)`

**Tabela - coluna de ações (linha 255-258):**
- Adicionar botão Pencil antes do Trash2

**Modal Adicionar (linhas 200-216):**
- Adicionar campo `invite_link` ao `newGroup` state e ao formulário

**Modal Editar (novo Dialog):**
- Renderizado fora da tabela, controlado por `editDialogOpen`
- Campos: nome/ID (read-only), invite_link (Input), categories (Badges clicáveis), is_flash_deals_only (Switch)

