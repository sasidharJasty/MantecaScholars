-- Update profiles table with has_seen_onboarding flag
ALTER TABLE public.profiles ADD COLUMN has_seen_onboarding BOOLEAN DEFAULT FALSE;
