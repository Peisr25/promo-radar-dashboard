

# Mini Log de Atividades para Automacoes

## Resumo

Adicionar uma tabela `automation_logs` ao banco de dados e um componente visual de log compacto (estilo timeline) na pagina de Automacoes, com atualizacao em tempo real via Realtime.

## Alteracoes

### 1. Nova tabela `automation_logs` (Migracao SQL)

```text
CREATE TABLE public.automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  scrape_id bigint,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Utilizadores autenticados veem os seus proprios logs
CREATE POLICY "Users view own automation logs"
ON public.automation_logs FOR SELECT
USING (auth.uid() = user_id);

-- INSERT para utilizadores autenticados e service_role (edge functions)
CREATE POLICY "Users insert own automation logs"
ON public.automation_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_logs;
```

A coluna `user_id` e necessaria para que as politicas RLS filtrem logs por utilizador. `rule_id` referencia `automation_rules` com `ON DELETE SET NULL` para manter o historico mesmo se a regra for eliminada.

### 2. Novo componente `src/components/automations/AutomationActivityLog.tsx`

Componente compacto estilo timeline que:

- Faz fetch dos ultimos 50 registos de `automation_logs` ordenados por `created_at DESC`
- Faz JOIN com `automation_rules` para mostrar o nome da regra (via query separada ou usando os dados ja carregados na pagina)
- Subscreve ao canal Realtime de `automation_logs` para receber novos logs instantaneamente (INSERT events filtrados por `user_id`)
- Design com icones e cores por status:
  - **success**: icone CheckCircle verde
  - **processing**: icone Clock azul
  - **skipped**: icone SkipForward amarelo/cinza
  - **error**: icone XCircle vermelho
- Cada entrada mostra: badge de status, mensagem, nome da regra (se disponivel), e hora formatada ("Hoje as 14:32" / "Ontem as 09:15" / data completa)
- ScrollArea com altura fixa para manter o layout compacto

### 3. Atualizacao de `src/pages/Automations.tsx`

Dividir o layout da pagina em duas seccoes:

- **Seccao superior**: conteudo atual (header + grid de cards de regras)
- **Seccao inferior**: Card com titulo "Log de Atividades Recentes" contendo o componente `AutomationActivityLog`

Layout responsivo: em desktop ocupa toda a largura abaixo dos cards; nao altera o layout existente dos cards.

### 4. Ficheiros a criar/editar

| Ficheiro | Acao |
|---|---|
| `supabase/migrations/..._automation_logs.sql` | Criar tabela + RLS + Realtime |
| `src/components/automations/AutomationActivityLog.tsx` | Criar componente de log |
| `src/pages/Automations.tsx` | Adicionar seccao do log abaixo dos cards |

### Detalhes tecnicos do componente de log

- Usa `useQuery` para fetch inicial dos 50 logs mais recentes
- Usa `supabase.channel('automation-logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'automation_logs' }, callback).subscribe()` para Realtime
- Novos logs sao adicionados ao topo do state local (prepend) sem refetch completo
- Formatacao de hora com `date-fns` (ja instalado): `isToday` -> "Hoje as HH:mm", `isYesterday` -> "Ontem as HH:mm", caso contrario `format(date, "dd/MM HH:mm")`
- O mapa de nomes de regras reutiliza os dados de `automation_rules` ja carregados na pagina pai, passados como prop

