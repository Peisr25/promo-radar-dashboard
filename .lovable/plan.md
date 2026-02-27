

## Semaforo de Lotacao + Ultima Atualizacao + Auto-Refresh na pagina /grupos

### Resumo

Substituir os dados estaticos hardcoded da pagina Groups.tsx por dados reais vindos da base de dados, e implementar 3 melhorias de UX: semaforo LED de lotacao, indicador de ultima atualizacao, e auto-refresh.

### 1. Buscar grupos reais da base de dados

Atualmente a pagina usa um array `const groups = [...]` hardcoded. Vamos substituir por um `useQuery` que faz SELECT na tabela `whatsapp_groups` filtrando `is_active = true`.

Campos necessarios: `id`, `group_name`, `group_description`, `categories`, `participant_count`, `max_participants`, `is_full`, `invite_link`, `is_flash_deals_only`, `messages_sent`, `updated_at`.

A RLS policy "Permitir leitura publica de grupos ativos" ja permite leitura anonima de grupos ativos.

### 2. Semaforo de Lotacao (Traffic Light LED)

Substituir o icone estatico de status por uma div redonda com `animate-pulse` e box-shadow glow:

- **Verde** (ocupacao < 80%): `bg-green-500 shadow-[0_0_8px_#22c55e]`, texto "Vagas Abertas" em verde
- **Amarelo** (80-99%): `bg-yellow-500 shadow-[0_0_8px_#eab308]`, texto "Ultimas Vagas" em amarelo  
- **Vermelho** (is_full ou >= 100%): `bg-red-500 shadow-[0_0_8px_#ef4444]`, texto "Lista de Espera" em vermelho

Funcao auxiliar `getTrafficLight(participantCount, maxParticipants, isFull)` retorna `{ color, glow, label, textColor }`.

### 3. Sistema de Ultima Atualizacao

Usar `formatDistanceToNow` do `date-fns` (ja instalado) com `{ addSuffix: true, locale: ptBR }` para mostrar "Atualizado ha X min/horas".

Texto discreto `text-[10px] text-muted-foreground` com icone de relogio, posicionado junto ao badge de membros no topo da imagem do card.

### 4. Auto-Refresh

Adicionar `refetchInterval: 1000 * 60 * 60` (1 hora) ao useQuery para refetch automatico.

### 5. Mapeamento de dados

Os dados da base serao mapeados para o formato visual do card:
- `group_name` -> titulo
- `group_description` -> descricao
- `participant_count` -> contagem de membros (formatada: "12.5k")
- `categories[0]` -> badge e categoria para filtro
- `is_flash_deals_only` -> badge "HOT" / icone de raio
- `invite_link` -> link do CTA
- `is_full` -> logica do semaforo e CTA (Entrar vs Avisar Vaga)
- Imagem: manter uma imagem placeholder por categoria (mapa estatico) ja que grupos nao tem campo de imagem

As categorias do filtro serao geradas dinamicamente a partir das categorias unicas encontradas nos grupos, mantendo "Todos" como primeira opcao.

### Detalhes tecnicos

**Ficheiro:** `src/pages/Groups.tsx`

**Novos imports:**
- `useQuery` de `@tanstack/react-query`
- `supabase` de `@/integrations/supabase/client`
- `formatDistanceToNow` de `date-fns`
- `ptBR` de `date-fns/locale/pt-BR`

**Funcao auxiliar getTrafficLight:**
```text
function getTrafficLight(count: number, max: number, isFull: boolean) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  if (isFull || pct >= 100) return { dot: "bg-red-500", glow: "shadow-[0_0_8px_#ef4444]", label: "Lista de Espera", text: "text-red-400" };
  if (pct >= 80) return { dot: "bg-yellow-500", glow: "shadow-[0_0_8px_#eab308]", label: "Ultimas Vagas", text: "text-yellow-400" };
  return { dot: "bg-green-500", glow: "shadow-[0_0_8px_#22c55e]", label: "Vagas Abertas", text: "text-green-400" };
}
```

**Funcao formatMembers:** Formata numeros como "12.5k", "1.2k", etc.

**Mapa de imagens por categoria:** Objeto estatico que associa cada categoria (Tech, Casa, Moda, etc.) a uma URL de imagem, reutilizando as imagens ja existentes no codigo atual.

**Query Supabase:**
```text
supabase.from("whatsapp_groups")
  .select("id, group_name, group_description, categories, participant_count, max_participants, is_full, invite_link, is_flash_deals_only, messages_sent, updated_at")
  .eq("is_active", true)
```

**Estado de loading:** Skeleton cards enquanto carrega, mensagem de erro se falhar.

