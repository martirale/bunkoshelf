ALTER TABLE book_series
  ADD COLUMN IF NOT EXISTS collection_type TEXT CHECK (collection_type IN ('series', 'set'));

UPDATE book_file_checksums
SET checksum = '';
