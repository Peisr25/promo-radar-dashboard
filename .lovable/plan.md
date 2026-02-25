

# Correcao: Links Encurtados Bloqueados para Utilizadores Anonimos

## Problema

Quando alguem clica num link encurtado (ex: `radardaspromos.lovable.app/r/JIgnEI`), a consulta a tabela `short_links` falha silenciosamente porque a politica RLS so permite leitura ao dono do link (`auth.uid() = user_id`). Como o visitante nao esta autenticado, o Supabase retorna zero resultados, o componente interpreta como erro e redireciona para `/` (que por sua vez redireciona para `/auth`).

## Diagnostico

- **Roteamento**: Ja esta correto. A rota `/r/:shortCode` esta fora do `DashboardLayout` (que e o auth guard). Nao precisa de alteracao.
- **Componente Redirect**: Nao usa `useAuth` nem contextos protegidos. Nao precisa de alteracao.
- **RLS (causa raiz)**: A tabela `short_links` tem apenas a politica "Users manage own links" (ALL, `auth.uid() = user_id`). Utilizadores anonimos nao conseguem fazer SELECT.
- **click_logs**: Ja tem politica de INSERT publica (`true`). OK.

## Solucao

Uma unica alteracao: adicionar uma politica RLS na tabela `short_links` que permita SELECT publico (para o role `anon`), limitado apenas as colunas necessarias para o redirecionamento.

### Migracao SQL

```sql
CREATE POLICY "Allow public read for redirection"
ON public.short_links
FOR SELECT
TO anon
USING (is_active = true);
```

Esta politica permite que qualquer visitante anonimo consulte links ativos. Links desativados (`is_active = false`) continuam inacessiveis.

### Nenhuma alteracao de codigo necessaria

O roteamento e o componente `Redirect.tsx` ja estao correctamente configurados:
- Rota `/r/:shortCode` fora do layout protegido
- Componente sem dependencias de autenticacao
- `resolveAndTrack()` usa o cliente Supabase anonimo, que funcionara assim que a politica RLS for aplicada

