-- Fix security definer view issue
ALTER VIEW public.vw_raw_scrapes_detailed SET (security_invoker = on);