CREATE TABLE library_conversions (
  source_path TEXT PRIMARY KEY,
  target_path TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL CHECK (provider IN ('local', 'cloud')),
  target_created BOOLEAN NOT NULL DEFAULT FALSE,
  committed BOOLEAN NOT NULL DEFAULT FALSE,
  source_files JSONB NOT NULL,
  target_files JSONB NOT NULL DEFAULT '[]'::jsonb
);
