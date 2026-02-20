ALTER TABLE public.whatsapp_messages_log
  DROP CONSTRAINT whatsapp_messages_log_group_id_fkey;

ALTER TABLE public.whatsapp_messages_log
  ADD CONSTRAINT whatsapp_messages_log_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES public.whatsapp_groups(id) ON DELETE CASCADE;