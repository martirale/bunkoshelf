ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS parental_control_mode TEXT NOT NULL DEFAULT 'flexible',
  ADD CONSTRAINT app_settings_parental_control_mode_valid CHECK (
    parental_control_mode IN ('flexible', 'strict')
  );
