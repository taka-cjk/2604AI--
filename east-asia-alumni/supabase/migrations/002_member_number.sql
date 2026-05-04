-- Add member_number column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_number INTEGER UNIQUE;

-- Set member #0 for the admin user
UPDATE profiles SET member_number = 0
WHERE id = (SELECT id FROM auth.users WHERE email = 'ikotakairoiro@gmail.com');

-- Assign sequential numbers to existing non-seed users ordered by created_at
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM profiles
  WHERE NOT (tags @> ARRAY['seed'])
  AND id != (SELECT id FROM auth.users WHERE email = 'ikotakairoiro@gmail.com')
  AND member_number IS NULL
)
UPDATE profiles p SET member_number = n.rn
FROM numbered n WHERE p.id = n.id;

-- Auto-assign member_number to new non-seed users on insert
CREATE OR REPLACE FUNCTION assign_member_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.member_number IS NULL AND NOT (NEW.tags @> ARRAY['seed']) THEN
    NEW.member_number := (SELECT COALESCE(MAX(member_number), 0) + 1 FROM profiles);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_member_number
BEFORE INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION assign_member_number();
