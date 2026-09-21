-- Split university and graduate-school affiliations while preserving existing
-- university rows. Academic names selected from the application catalogue are
-- stored under one canonical name by the API.

ALTER TABLE public.profile_affiliations
  DROP CONSTRAINT IF EXISTS profile_affiliations_affiliation_type_check,
  ADD CONSTRAINT profile_affiliations_affiliation_type_check CHECK (
    affiliation_type IN ('university', 'graduate_school', 'company', 'other', 'none')
  );

-- Consolidate the known Keio variants that may already have been saved before
-- canonicalization was introduced. Keep the earliest entry if variants collide.
WITH ranked_keio AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY profile_id, affiliation_type
      ORDER BY position, created_at, id
    ) AS occurrence
  FROM public.profile_affiliations
  WHERE affiliation_type IN ('university', 'graduate_school')
    AND LOWER(BTRIM(affiliation_name)) IN (
      'keio',
      'keio university',
      '慶応',
      '慶應',
      '慶応義塾',
      '慶應義塾',
      '慶応義塾大学',
      '慶應義塾大学'
    )
)
DELETE FROM public.profile_affiliations AS affiliation
USING ranked_keio
WHERE affiliation.id = ranked_keio.id
  AND ranked_keio.occurrence > 1;

UPDATE public.profile_affiliations
SET affiliation_name = 'Keio University'
WHERE affiliation_type IN ('university', 'graduate_school')
  AND LOWER(BTRIM(affiliation_name)) IN (
    'keio',
    'keio university',
    '慶応',
    '慶應',
    '慶応義塾',
    '慶應義塾',
    '慶応義塾大学',
    '慶應義塾大学'
  );

-- Replace a user's affiliation list in one transaction. Ownership continues to
-- come only from auth.uid(); callers cannot choose a profile ID.
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
    WHERE item->>'type' NOT IN ('university', 'graduate_school', 'company', 'other', 'none')
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
