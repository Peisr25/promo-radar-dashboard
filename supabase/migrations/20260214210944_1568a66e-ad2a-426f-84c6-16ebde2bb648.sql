
-- Tabela para armazenar configurações da Evolution API
CREATE TABLE public.evolution_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  api_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_test_at TIMESTAMPTZ,
  last_test_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.evolution_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own evolution config"
ON public.evolution_config FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Tabela para grupos do WhatsApp
CREATE TABLE public.whatsapp_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  group_id TEXT NOT NULL,
  group_name TEXT NOT NULL,
  group_description TEXT,
  is_active BOOLEAN DEFAULT true,
  messages_sent INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_id)
);

ALTER TABLE public.whatsapp_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own whatsapp groups"
ON public.whatsapp_groups FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Tabela para log de mensagens
CREATE TABLE public.whatsapp_messages_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  promotion_id UUID REFERENCES public.promotions(id),
  group_id UUID REFERENCES public.whatsapp_groups(id),
  message_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  api_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_messages_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own message logs"
ON public.whatsapp_messages_log FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own message logs"
ON public.whatsapp_messages_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Função para incrementar contador de mensagens
CREATE OR REPLACE FUNCTION public.increment_group_messages(group_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.whatsapp_groups
  SET messages_sent = messages_sent + 1,
      last_message_at = NOW()
  WHERE id = group_id_param;
END;
$$;

-- Triggers para updated_at
CREATE TRIGGER update_evolution_config_updated_at
BEFORE UPDATE ON public.evolution_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_groups_updated_at
BEFORE UPDATE ON public.whatsapp_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_whatsapp_groups_user_active ON public.whatsapp_groups(user_id, is_active);
CREATE INDEX idx_whatsapp_messages_log_user ON public.whatsapp_messages_log(user_id);
CREATE INDEX idx_whatsapp_messages_log_promotion ON public.whatsapp_messages_log(promotion_id);
