
# Adicionar Horario Comercial ao Painel do Motor

## Resumo
Adicionar dois campos de horario comercial (inicio e termino) ao painel de configuracoes do Motor na pagina de Automacoes, com texto de ajuda sobre grupos de Ofertas Relampago.

## Alteracoes

### 1. Atualizar interface `MotorControl` (src/pages/Automations.tsx)
- Adicionar `business_hours_start` e `business_hours_end` ao tipo `MotorControl`

### 2. Adicionar estados para os novos campos
- Criar `useState` para `businessStart` (default "06:00") e `businessEnd` (default "01:00")
- Inicializar os valores em `handleOpenSettings` a partir do `motorControl`

### 3. Adicionar inputs no painel de configuracoes
- Alterar o grid de `sm:grid-cols-3` para `sm:grid-cols-2 lg:grid-cols-3` (ou manter 3 colunas e criar uma segunda linha)
- Adicionar dois novos campos com `type="time"`:
  - "Inicio do Horario Comercial" (valor padrao 06:00)
  - "Termino do Horario Comercial" (valor padrao 01:00)
- Adicionar texto muted abaixo dos campos: "Grupos marcados como Ofertas Relampago ignoram esta regra e recebem mensagens 24h por dia."

### 4. Atualizar funcao de salvar (`saveLimitsMutation`)
- Incluir `business_hours_start` e `business_hours_end` no payload de update e insert

### Detalhes Tecnicos
- Os campos ja existem na tabela `motor_control` (text, defaults '06:00' e '01:00')
- O tipo em `types.ts` ja inclui esses campos, portanto nao ha necessidade de migracoes
- O grid do painel passara a ter 5 campos no total, organizados em duas linhas
