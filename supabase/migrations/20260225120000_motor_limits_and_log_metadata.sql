-- Add rate limit columns to motor_control
ALTER TABLE public.motor_control
  ADD COLUMN IF NOT EXISTS max_messages_per_hour integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_messages_per_day integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_run_sent integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_run_errors integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_run_skipped integer DEFAULT 0;

-- Add metadata column to automation_logs for structured extra info
ALTER TABLE public.automation_logs
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Allow service role to update automation_logs (for motor edge function)
CREATE POLICY "Service role manages automation logs"
ON public.automation_logs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
