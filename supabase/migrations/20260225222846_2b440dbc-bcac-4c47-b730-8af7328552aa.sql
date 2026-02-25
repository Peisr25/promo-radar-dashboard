ALTER TABLE public.whatsapp_messages_log
  DROP CONSTRAINT whatsapp_messages_log_promotion_id_fkey;

ALTER TABLE public.whatsapp_messages_log
  ADD CONSTRAINT whatsapp_messages_log_promotion_id_fkey
  FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE CASCADE;