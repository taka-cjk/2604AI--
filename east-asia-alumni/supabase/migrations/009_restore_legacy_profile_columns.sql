-- These profile fields existed in production before SQL migrations were kept in
-- source control. Keep the migration idempotent so it is a no-op when eventually
-- applied to production, while making a clean development project reproducible.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sns_links JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS area TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS wants TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS email_opt_out BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_on_map BOOLEAN NOT NULL DEFAULT true;
