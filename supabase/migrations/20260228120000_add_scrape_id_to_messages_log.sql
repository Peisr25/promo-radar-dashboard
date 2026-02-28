-- Add scrape_id to whatsapp_messages_log for deduplication.
-- Prevents the same promotion from being sent twice to the same group
-- if the motor crashes or is paused mid-run.

ALTER TABLE whatsapp_messages_log
  ADD COLUMN IF NOT EXISTS scrape_id UUID;

-- Index for fast dedup lookups: (scrape_id, group_id, status)
CREATE INDEX IF NOT EXISTS idx_messages_log_dedup
  ON whatsapp_messages_log (scrape_id, group_id, status)
  WHERE scrape_id IS NOT NULL;
