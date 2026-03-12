

# Atualizar UI do Motor de Automacoes

## Resumo
Tres melhorias na pagina `Automations.tsx`: (1) melhorar campos de horario comercial com tooltip e fuso horario, (2) badge visual de status do motor, (3) botao de destravar emergencial.

## Alteracoes em `src/pages/Automations.tsx`

### 1. Horario Comercial - Melhorar campos existentes
Os campos `time` ja existem. Alteracoes:
- Adicionar texto "Horario de Brasilia (UTC-3)" abaixo dos inputs (substituir os textos de ajuda atuais)
- Adicionar icone `Info` com `Tooltip` ao lado das labels explicando: "Fora deste horario, as ofertas ficam pausadas. Ofertas de grupos Relampago furam este bloqueio e sao enviadas 24h/dia."
- Importar `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` de `@/components/ui/tooltip` e icone `Info` do lucide

### 2. Badge de Status do Motor
- Adicionar um badge logo apos o titulo "Automacoes" (ou na barra de header, ao lado dos botoes)
- Ler `isMotorRunning` (ja existe):
  - `true`: Badge verde com classe `animate-pulse` e texto "Motor em Execucao"
  - `false`: Badge cinza/outline com texto "Motor em Espera"

### 3. Botao Destravar Emergencial
- Adicionar botao `variant="outline"` com icone `RefreshCw` (lucide) no header, ao lado do botao de settings
- Label: "Destravar Fila"
- Ao clicar, executar mutation que:
  1. `UPDATE motor_control SET is_running = false, updated_at = now()` (via `.update()`)
  2. `UPDATE raw_scrapes SET status = 'pending' WHERE status = 'processing'` (via `.update().eq("status", "processing")`)
- Toast de sucesso: "Sistema destravado com sucesso. Os envios serao retomados na proxima verificacao."
- Importar `RefreshCw` do lucide

### Detalhes Tecnicos
- Nenhuma migracao necessaria - todas as tabelas e colunas ja existem
- O `raw_scrapes` tem RLS que permite UPDATE para authenticated users
- O `motor_control` ja tem RLS com policy ALL para o proprio user
- Apenas edicoes em `src/pages/Automations.tsx`

