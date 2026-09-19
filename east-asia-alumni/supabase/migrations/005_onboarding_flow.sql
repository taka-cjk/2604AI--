-- Multi-step onboarding for new users.
-- Existing profiles are marked complete before the new defaults take effect for
-- future signups, so this migration does not interrupt existing members.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age_group TEXT,
  ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_current_step SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

UPDATE public.profiles
SET
  onboarding_current_step = 6,
  onboarding_completed_at = COALESCE(onboarding_completed_at, NOW())
WHERE onboarding_completed_at IS NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_age_group_check,
  ADD CONSTRAINT profiles_age_group_check CHECK (
    age_group IS NULL OR age_group IN (
      'under_18',
      '18_22',
      '23_29',
      '30_39',
      '40_plus',
      'prefer_not_to_say'
    )
  ),
  DROP CONSTRAINT IF EXISTS profiles_onboarding_current_step_check,
  ADD CONSTRAINT profiles_onboarding_current_step_check
    CHECK (onboarding_current_step BETWEEN 1 AND 6),
  DROP CONSTRAINT IF EXISTS profiles_privacy_policy_pair_check,
  ADD CONSTRAINT profiles_privacy_policy_pair_check CHECK (
    (privacy_policy_accepted_at IS NULL AND privacy_policy_version IS NULL)
    OR
    (privacy_policy_accepted_at IS NOT NULL AND privacy_policy_version IS NOT NULL)
  ),
  DROP CONSTRAINT IF EXISTS profiles_full_name_onboarding_check,
  ADD CONSTRAINT profiles_full_name_onboarding_check
    CHECK (char_length(BTRIM(full_name)) BETWEEN 1 AND 100) NOT VALID;

CREATE TABLE IF NOT EXISTS public.profile_affiliations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  affiliation_type TEXT NOT NULL CHECK (
    affiliation_type IN ('university', 'company', 'other', 'none')
  ),
  affiliation_name TEXT,
  position SMALLINT NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT profile_affiliations_name_check CHECK (
    (affiliation_type = 'none' AND affiliation_name IS NULL)
    OR
    (
      affiliation_type <> 'none'
      AND affiliation_name IS NOT NULL
      AND char_length(BTRIM(affiliation_name)) BETWEEN 1 AND 120
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_profile_affiliations_profile_id
  ON public.profile_affiliations(profile_id, position);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_affiliations_unique_value
  ON public.profile_affiliations(
    profile_id,
    affiliation_type,
    COALESCE(LOWER(affiliation_name), '')
  );

ALTER TABLE public.profile_affiliations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own affiliations" ON public.profile_affiliations;
CREATE POLICY "Users can view own affiliations"
  ON public.profile_affiliations FOR SELECT
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can insert own affiliations" ON public.profile_affiliations;
CREATE POLICY "Users can insert own affiliations"
  ON public.profile_affiliations FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can update own affiliations" ON public.profile_affiliations;
CREATE POLICY "Users can update own affiliations"
  ON public.profile_affiliations FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can delete own affiliations" ON public.profile_affiliations;
CREATE POLICY "Users can delete own affiliations"
  ON public.profile_affiliations FOR DELETE
  USING (auth.uid() = profile_id);

-- Replace a user's affiliation list in one transaction. The function always
-- derives ownership from auth.uid(); callers cannot provide a profile ID.
CREATE OR REPLACE FUNCTION public.replace_my_onboarding_affiliations(
  p_affiliations JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_distinct_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF jsonb_typeof(p_affiliations) <> 'array' THEN
    RAISE EXCEPTION 'Affiliations must be an array';
  END IF;

  v_count := jsonb_array_length(p_affiliations);
  IF v_count < 1 OR v_count > 10 THEN
    RAISE EXCEPTION 'Between 1 and 10 affiliations are required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_affiliations) AS item
    WHERE item->>'type' NOT IN ('university', 'company', 'other', 'none')
      OR (
        item->>'type' = 'none'
        AND NULLIF(BTRIM(COALESCE(item->>'name', '')), '') IS NOT NULL
      )
      OR (
        item->>'type' <> 'none'
        AND (
          NULLIF(BTRIM(COALESCE(item->>'name', '')), '') IS NULL
          OR char_length(BTRIM(item->>'name')) > 120
        )
      )
  ) THEN
    RAISE EXCEPTION 'Invalid affiliation';
  END IF;

  IF v_count > 1 AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_affiliations) AS item
    WHERE item->>'type' = 'none'
  ) THEN
    RAISE EXCEPTION 'None cannot be combined with another affiliation';
  END IF;

  SELECT COUNT(*)
  INTO v_distinct_count
  FROM (
    SELECT DISTINCT
      item->>'type' AS affiliation_type,
      LOWER(COALESCE(BTRIM(item->>'name'), '')) AS affiliation_name
    FROM jsonb_array_elements(p_affiliations) AS item
  ) AS distinct_affiliations;

  IF v_distinct_count <> v_count THEN
    RAISE EXCEPTION 'Duplicate affiliations are not allowed';
  END IF;

  DELETE FROM public.profile_affiliations
  WHERE profile_id = auth.uid();

  INSERT INTO public.profile_affiliations (
    profile_id,
    affiliation_type,
    affiliation_name,
    position
  )
  SELECT
    auth.uid(),
    item->>'type',
    CASE
      WHEN item->>'type' = 'none' THEN NULL
      ELSE BTRIM(item->>'name')
    END,
    (ordinality - 1)::SMALLINT
  FROM jsonb_array_elements(p_affiliations) WITH ORDINALITY AS entries(item, ordinality);
END;
$$;

GRANT EXECUTE ON FUNCTION public.replace_my_onboarding_affiliations(JSONB)
  TO authenticated;
