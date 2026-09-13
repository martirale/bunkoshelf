ALTER TABLE book_metadata
  ADD COLUMN IF NOT EXISTS epub_version TEXT;
