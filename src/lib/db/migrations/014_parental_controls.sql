ALTER TABLE users
  ADD COLUMN IF NOT EXISTS birth_month SMALLINT,
  ADD COLUMN IF NOT EXISTS birth_day SMALLINT,
  ADD COLUMN IF NOT EXISTS parental_control_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS parental_control_mode TEXT NOT NULL DEFAULT 'flexible';

ALTER TABLE users
  ADD CONSTRAINT users_birth_date_valid CHECK (
    (birth_month IS NULL AND birth_day IS NULL)
    OR (
      birth_year IS NOT NULL
      AND birth_month BETWEEN 1 AND 12
      AND birth_day BETWEEN 1 AND 31
      AND make_date(birth_year, birth_month, birth_day) IS NOT NULL
    )
  ),
  ADD CONSTRAINT users_parental_control_mode_valid CHECK (
    parental_control_mode IN ('flexible', 'strict')
  );

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS parental_control_enabled BOOLEAN NOT NULL DEFAULT FALSE;
