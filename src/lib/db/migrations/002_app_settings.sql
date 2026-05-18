CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  others_library_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (id, others_library_enabled)
VALUES ('global', FALSE)
ON CONFLICT (id) DO NOTHING;
