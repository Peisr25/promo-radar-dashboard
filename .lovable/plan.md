

## Adicionar botao "Gerar Grupos Iniciais (API)" no WhatsAppSettings

### Resumo

O botao solicitado nao existe ainda na pagina. Vamos adiciona-lo ao `src/pages/WhatsAppSettings.tsx` com a logica de gerar os 8 grupos pre-definidos via Edge Function.

### Implementacao

**Ficheiro:** `src/pages/WhatsAppSettings.tsx`

#### 1. Novo estado

Adicionar estado para controlar o fluxo:
- `seedingGroups` (boolean) - loading state
- `seedAdminNumber` (string) - numero do admin
- `seedDialogOpen` (boolean) - modal de confirmacao

#### 2. Array de grupos pre-definidos

Constante `SEED_GROUPS` com os 8 grupos exatos:

```text
const SEED_GROUPS = [
  { name: 'Radar das Promos TECH #01', categories: ['Tech'], is_flash_deals_only: false },
  { name: 'Radar das Promos CASA #01', categories: ['Casa'], is_flash_deals_only: false },
  { name: 'Radar das Promos MODA #01', categories: ['Moda'], is_flash_deals_only: false },
  { name: 'Radar das Promos GEEK #01', categories: ['Geek'], is_flash_deals_only: false },
  { name: 'Radar das Promos RELAMPAGO #01', categories: ['Relampago'], is_flash_deals_only: true },
  { name: 'Radar das Promos KIDS #01', categories: ['Kids'], is_flash_deals_only: false },
  { name: 'Radar das Promos GERAL #01', categories: ['Geral'], is_flash_deals_only: false },
  { name: 'Radar das Promos SHOPEE #01', categories: ['Achadinhos da Shopee'], is_flash_deals_only: false },
];
```

#### 3. Funcao `handleSeedGroups`

- Validar que `seedAdminNumber` nao esta vazio
- Iterar sobre `SEED_GROUPS`, chamando `supabase.functions.invoke("manage-whatsapp-groups", { body: { action: "create", name, admin_number, categories, is_flash_deals_only } })` para cada grupo
- Contar sucessos e falhas
- Mostrar toast com resultado
- Fechar modal e recarregar grupos

#### 4. UI - Botao e Modal

Adicionar um botao ao lado dos existentes na barra de acoes do card de grupos:
```text
<Button size="sm" variant="outline" onClick={() => setSeedDialogOpen(true)}>
  <Sparkles /> Gerar Grupos Iniciais (API)
</Button>
```

Modal (Dialog) pedindo apenas o numero do admin (formato internacional, ex: 5511999999999), com botao de confirmacao que executa `handleSeedGroups`.

#### 5. Atualizacao do CATEGORY_OPTIONS

Adicionar 'Relampago', 'Achadinhos da Shopee' ao array `CATEGORY_OPTIONS` para que possam ser usados em edicoes futuras.

### Ficheiros alterados

- `src/pages/WhatsAppSettings.tsx` (unico ficheiro)

