
-- 1. Create source_credentials table
CREATE TABLE public.source_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_name text NOT NULL,
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, source_name)
);

ALTER TABLE public.source_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own source credentials"
ON public.source_credentials FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_source_credentials_updated_at
  BEFORE UPDATE ON public.source_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add delay_between_messages to motor_control
ALTER TABLE public.motor_control
ADD COLUMN IF NOT EXISTS delay_between_messages integer NOT NULL DEFAULT 8;
