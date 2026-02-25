
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

CREATE POLICY "Users view own automation logs"
ON public.automation_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own automation logs"
ON public.automation_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_logs;
