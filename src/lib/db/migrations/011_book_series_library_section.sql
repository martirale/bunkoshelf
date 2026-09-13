ALTER TABLE book_series
  ADD COLUMN IF NOT EXISTS library_section TEXT NOT NULL DEFAULT 'books';

ALTER TABLE book_series
  DROP CONSTRAINT IF EXISTS book_series_library_section_check;

ALTER TABLE book_series
  ADD CONSTRAINT book_series_library_section_check
  CHECK (library_section IN ('books', 'other'));

CREATE INDEX IF NOT EXISTS book_series_library_section_idx
  ON book_series (library_section);
