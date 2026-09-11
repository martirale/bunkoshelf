DO $$
BEGIN
  IF to_regclass('public.library_series') IS NULL
    AND to_regclass('public.manga_series') IS NOT NULL THEN
    ALTER TABLE manga_series RENAME TO library_series;
  END IF;

  IF to_regclass('public.library_volumes') IS NULL
    AND to_regclass('public.manga_volumes') IS NOT NULL THEN
    ALTER TABLE manga_volumes RENAME TO library_volumes;
  END IF;
END;
$$;

ALTER TABLE library_series
  ADD COLUMN IF NOT EXISTS library_section TEXT NOT NULL DEFAULT 'manga';

ALTER TABLE library_series
  DROP CONSTRAINT IF EXISTS manga_series_library_section_check;

ALTER TABLE library_series
  ADD CONSTRAINT library_series_library_section_check
  CHECK (library_section IN ('manga', 'comic', 'other'));

ALTER TABLE library_series
  DROP CONSTRAINT IF EXISTS manga_series_slug_key;

ALTER TABLE library_series
  DROP CONSTRAINT IF EXISTS library_series_slug_key;

ALTER TABLE library_series
  ADD CONSTRAINT library_series_section_slug_key UNIQUE (library_section, slug);

ALTER TABLE library_volumes
  DROP CONSTRAINT IF EXISTS manga_volumes_slug_key;

ALTER TABLE library_volumes
  DROP CONSTRAINT IF EXISTS library_volumes_slug_key;

ALTER TABLE library_volumes
  ADD CONSTRAINT library_volumes_slug_key UNIQUE (slug);

CREATE INDEX IF NOT EXISTS library_series_section_idx
  ON library_series (library_section);

CREATE OR REPLACE VIEW manga_series AS
  SELECT * FROM library_series;

CREATE OR REPLACE VIEW manga_volumes AS
  SELECT * FROM library_volumes;
