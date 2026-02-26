-- Adiciona colunas para gerir os nichos e links na tabela de grupos
ALTER TABLE public.whatsapp_groups
ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS invite_link text,
ADD COLUMN IF NOT EXISTS is_flash_deals_only boolean DEFAULT false;

-- Atualiza as permissões para o público conseguir ler os grupos ativos (para a Landing Page)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Permitir leitura pública de grupos ativos'
    AND tablename = 'whatsapp_groups'
  ) THEN
    CREATE POLICY "Permitir leitura pública de grupos ativos"
    ON public.whatsapp_groups FOR SELECT
    USING (is_active = true);
  END IF;
END $$;
