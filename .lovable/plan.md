

# Modulo de Automacao de Envios (Auto-Publishing)

## Resumo

Criar um sistema de regras de automacao que permita rotear promoções automaticamente para grupos de WhatsApp com base em categorias, desconto minimo e configuracao de IA, sem intervencao manual no Pipeline.

## Alteracoes

### 1. Nova tabela `automation_rules` (Migracao SQL)

Criar a tabela com os campos solicitados e politica RLS para CRUD do utilizador autenticado:

```text
CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  categories text[] NOT NULL DEFAULT '{}',
  min_discount numeric NOT NULL DEFAULT 0,
  target_group_id text NOT NULL,
  ai_mode text NOT NULL DEFAULT 'urubu_padrao',
  custom_ai_options jsonb DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own automation rules"
ON public.automation_rules FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### 2. Sidebar (`src/components/AppSidebar.tsx`)

Adicionar o import do icone `Bot` e a entrada `{ title: "Automacoes", url: "/automations", icon: Bot }` no array `navItems`, entre "Pipeline" e "Scraper Logs".

### 3. Rota no `App.tsx`

Adicionar import de `Automations` e a rota `<Route path="/automations" element={<Automations />} />` dentro do `DashboardLayout`.

### 4. Nova pagina `src/pages/Automations.tsx`

- Lista as regras da tabela `automation_rules` em cards.
- Cada card mostra: nome, categorias (badges), desconto minimo, grupo destino, modo IA.
- Switch/toggle inline para ligar/desligar `is_active` com update direto no banco.
- Botao "Excluir" em cada card.
- Botao "Nova Automacao" no topo que abre o modal de criacao.

### 5. Modal de criacao de regra (`src/components/automations/AutomationRuleModal.tsx`)

Formulario com React Hook Form + Zod contendo:

- **Nome da Regra**: input de texto (obrigatorio).
- **Categorias**: multi-select que busca categorias unicas de `raw_scrapes` via query `SELECT DISTINCT metadata->>'categoria' FROM raw_scrapes WHERE metadata->>'categoria' IS NOT NULL`.
- **Filtro de Desconto**: slider numerico (0-100) para `min_discount`.
- **Grupo de Destino**: select que lista os grupos da tabela `whatsapp_groups` do utilizador.
- **Configuracao da Copy (IA)**: Tabs com "Modo Urubu" (valor `urubu_padrao`) e "Personalizado" (valor `customizado`). No modo personalizado, exibe as mesmas checkboxes do `GenerateCopyModal` (destacar desconto, parcelamento, open box, urgencia) e select de tom de voz. Os valores sao guardados em `custom_ai_options` como JSON.

Validacao Zod:
```text
name: z.string().min(1).max(100)
categories: z.array(z.string()).min(1)
min_discount: z.number().min(0).max(100)
target_group_id: z.string().min(1)
ai_mode: z.enum(["urubu_padrao", "customizado"])
custom_ai_options: z.object({...}).optional()
```

### 6. Ficheiros a criar/editar

| Ficheiro | Acao |
|---|---|
| `supabase/migrations/...automation_rules.sql` | Criar tabela + RLS |
| `src/components/AppSidebar.tsx` | Adicionar item de menu |
| `src/App.tsx` | Adicionar rota |
| `src/pages/Automations.tsx` | Criar pagina |
| `src/components/automations/AutomationRuleModal.tsx` | Criar modal |

Nota: Este modulo cria a infraestrutura de regras (CRUD). A execucao automatica das regras (trigger que processa scrapes novos automaticamente) pode ser implementada numa fase seguinte como uma Edge Function ou cron job.

