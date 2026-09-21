-- IMPORTANT: Apply only after the application code that reads user_onboarding
-- has been deployed. This removes the legacy public columns kept by migration
-- 007 for zero-downtime compatibility.

DROP TRIGGER IF EXISTS sync_legacy_profile_onboarding_update ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_legacy_profile_onboarding();

CREATE OR REPLACE FUNCTION public.save_my_onboarding_name(p_name TEXT)
RETURNS SMALLINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_step SMALLINT;
  v_completed_at TIMESTAMPTZ;
  v_name TEXT := BTRIM(p_name);
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF v_name IS NULL OR char_length(v_name) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Invalid name';
  END IF;

  SELECT onboarding_current_step, onboarding_completed_at
  INTO v_step, v_completed_at
  FROM public.user_onboarding
  WHERE profile_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Onboarding state not found'; END IF;
  IF v_completed_at IS NOT NULL THEN RAISE EXCEPTION 'Onboarding is already complete'; END IF;

  v_step := GREATEST(v_step, 2);
  UPDATE public.profiles
  SET full_name = v_name, updated_at = NOW()
  WHERE id = v_user_id;
  UPDATE public.user_onboarding
  SET onboarding_current_step = v_step, updated_at = NOW()
  WHERE profile_id = v_user_id;

  RETURN v_step;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_my_onboarding_age_group(p_age_group TEXT)
RETURNS SMALLINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_step SMALLINT;
  v_completed_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_age_group IS NULL OR p_age_group NOT IN (
    'under_18', '18_22', '23_29', '30_39', '40_plus', 'prefer_not_to_say'
  ) THEN
    RAISE EXCEPTION 'Invalid age group';
  END IF;

  SELECT onboarding_current_step, onboarding_completed_at
  INTO v_step, v_completed_at
  FROM public.user_onboarding
  WHERE profile_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Onboarding state not found'; END IF;
  IF v_completed_at IS NOT NULL THEN RAISE EXCEPTION 'Onboarding is already complete'; END IF;
  IF v_step < 2 THEN RAISE EXCEPTION 'Complete the previous onboarding step first'; END IF;

  v_step := GREATEST(v_step, 3);
  UPDATE public.user_onboarding
  SET age_group = p_age_group,
      onboarding_current_step = v_step,
      updated_at = NOW()
  WHERE profile_id = v_user_id;

  RETURN v_step;
END;
$$;

CREATE OR REPLACE FUNCTION public.replace_my_onboarding_affiliations(p_affiliations JSONB)
RETURNS SMALLINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_count INTEGER;
  v_distinct_count INTEGER;
  v_step SMALLINT;
  v_completed_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_affiliations IS NULL OR jsonb_typeof(p_affiliations) <> 'array' THEN
    RAISE EXCEPTION 'Affiliations must be an array';
  END IF;

  SELECT onboarding_current_step, onboarding_completed_at
  INTO v_step, v_completed_at
  FROM public.user_onboarding
  WHERE profile_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Onboarding state not found'; END IF;
  IF v_completed_at IS NOT NULL THEN RAISE EXCEPTION 'Onboarding is already complete'; END IF;
  IF v_step < 3 THEN RAISE EXCEPTION 'Complete the previous onboarding step first'; END IF;

  v_count := jsonb_array_length(p_affiliations);
  IF v_count < 1 OR v_count > 10 THEN
    RAISE EXCEPTION 'Between 1 and 10 affiliations are required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_affiliations) AS item
    WHERE item->>'type' IS NULL
      OR item->>'type' NOT IN ('university', 'graduate_school', 'company', 'other', 'none')
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
    SELECT 1 FROM jsonb_array_elements(p_affiliations) AS item
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

  DELETE FROM public.profile_affiliations WHERE profile_id = v_user_id;
  INSERT INTO public.profile_affiliations (
    profile_id, affiliation_type, affiliation_name, position
  )
  SELECT
    v_user_id,
    item->>'type',
    CASE WHEN item->>'type' = 'none' THEN NULL ELSE BTRIM(item->>'name') END,
    (ordinality - 1)::SMALLINT
  FROM jsonb_array_elements(p_affiliations) WITH ORDINALITY AS entries(item, ordinality);

  v_step := GREATEST(v_step, 4);
  UPDATE public.user_onboarding
  SET onboarding_current_step = v_step, updated_at = NOW()
  WHERE profile_id = v_user_id;

  RETURN v_step;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_my_onboarding_interests(p_interests TEXT[])
RETURNS SMALLINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_step SMALLINT;
  v_completed_at TIMESTAMPTZ;
  v_count INTEGER;
  v_distinct_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_interests IS NULL THEN RAISE EXCEPTION 'Interests must be an array'; END IF;

  SELECT COUNT(*), COUNT(DISTINCT interest)
  INTO v_count, v_distinct_count
  FROM unnest(p_interests) AS interest;
  IF v_count <> v_distinct_count OR EXISTS (
    SELECT 1 FROM unnest(p_interests) AS interest
    WHERE interest NOT IN (
      'career', 'drink', 'world', 'study', 'event', 'business', 'language', 'side', 'local'
    )
  ) THEN
    RAISE EXCEPTION 'Invalid interests';
  END IF;

  SELECT onboarding_current_step, onboarding_completed_at
  INTO v_step, v_completed_at
  FROM public.user_onboarding
  WHERE profile_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Onboarding state not found'; END IF;
  IF v_completed_at IS NOT NULL THEN RAISE EXCEPTION 'Onboarding is already complete'; END IF;
  IF v_step < 4 THEN RAISE EXCEPTION 'Complete the previous onboarding step first'; END IF;

  v_step := GREATEST(v_step, 5);
  UPDATE public.profiles SET wants = p_interests WHERE id = v_user_id;
  UPDATE public.user_onboarding
  SET onboarding_current_step = v_step, updated_at = NOW()
  WHERE profile_id = v_user_id;

  RETURN v_step;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_my_onboarding(
  p_accepted BOOLEAN,
  p_privacy_policy_version TEXT
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_state public.user_onboarding%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_affiliation_count INTEGER;
  v_completed_at TIMESTAMPTZ := clock_timestamp();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_accepted IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'Privacy acceptance is required'; END IF;
  IF NULLIF(BTRIM(p_privacy_policy_version), '') IS NULL THEN
    RAISE EXCEPTION 'Privacy policy version is required';
  END IF;

  SELECT * INTO v_state
  FROM public.user_onboarding
  WHERE profile_id = v_user_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Onboarding state not found'; END IF;
  IF v_state.onboarding_completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Onboarding is already complete';
  END IF;
  IF v_state.onboarding_current_step < 5 THEN
    RAISE EXCEPTION 'Complete the previous onboarding steps first';
  END IF;
  IF v_state.age_group IS NULL THEN RAISE EXCEPTION 'Age group is required'; END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF char_length(BTRIM(v_profile.full_name)) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Valid name is required';
  END IF;
  IF v_profile.wants IS NULL OR EXISTS (
    SELECT 1 FROM unnest(v_profile.wants) AS interest
    WHERE interest NOT IN (
      'career', 'drink', 'world', 'study', 'event', 'business', 'language', 'side', 'local'
    )
  ) OR (
    SELECT COUNT(*) FROM unnest(v_profile.wants)
  ) <> (
    SELECT COUNT(DISTINCT interest) FROM unnest(v_profile.wants) AS interest
  ) THEN
    RAISE EXCEPTION 'Valid interests are required';
  END IF;

  SELECT COUNT(*) INTO v_affiliation_count
  FROM public.profile_affiliations
  WHERE profile_id = v_user_id;
  IF v_affiliation_count < 1 OR v_affiliation_count > 10 THEN
    RAISE EXCEPTION 'Valid affiliations are required';
  END IF;

  UPDATE public.user_onboarding
  SET privacy_policy_accepted_at = v_completed_at,
      privacy_policy_version = BTRIM(p_privacy_policy_version),
      onboarding_completed_at = v_completed_at,
      onboarding_current_step = 6,
      updated_at = NOW()
  WHERE profile_id = v_user_id;

  RETURN v_completed_at;
END;
$$;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_age_group_check,
  DROP CONSTRAINT IF EXISTS profiles_onboarding_current_step_check,
  DROP CONSTRAINT IF EXISTS profiles_privacy_policy_pair_check,
  DROP COLUMN IF EXISTS age_group,
  DROP COLUMN IF EXISTS privacy_policy_accepted_at,
  DROP COLUMN IF EXISTS privacy_policy_version,
  DROP COLUMN IF EXISTS onboarding_current_step,
  DROP COLUMN IF EXISTS onboarding_completed_at;
