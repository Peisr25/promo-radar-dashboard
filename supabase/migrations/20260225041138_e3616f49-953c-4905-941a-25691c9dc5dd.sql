
CREATE TABLE public.motor_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  is_running boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.motor_control ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own motor control"
ON public.motor_control FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
