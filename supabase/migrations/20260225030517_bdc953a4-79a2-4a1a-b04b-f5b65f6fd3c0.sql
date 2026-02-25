
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

CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
