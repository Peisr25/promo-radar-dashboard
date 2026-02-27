ALTER TABLE public.whatsapp_groups
  ADD COLUMN IF NOT EXISTS participant_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_participants integer DEFAULT 1024,
  ADD COLUMN IF NOT EXISTS is_full boolean DEFAULT false;