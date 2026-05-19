CREATE OR REPLACE FUNCTION bunko_natural_sort_key(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result TEXT := '';
  current_number TEXT := '';
  current_char TEXT;
  i INTEGER;
BEGIN
  IF input_text IS NULL THEN
    RETURN '';
  END IF;

  FOR i IN 1..char_length(input_text) LOOP
    current_char := substr(input_text, i, 1);

    IF current_char ~ '[0-9]' THEN
      current_number := current_number || current_char;
    ELSE
      IF current_number <> '' THEN
        result := result || lpad(current_number, 5, '0');
        current_number := '';
      END IF;

      result := result || lower(current_char);
    END IF;
  END LOOP;

  IF current_number <> '' THEN
    result := result || lpad(current_number, 5, '0');
  END IF;

  RETURN result;
END;
$$;

ALTER TABLE manga_series
  ADD COLUMN IF NOT EXISTS sort_title TEXT;

ALTER TABLE manga_volumes
  ADD COLUMN IF NOT EXISTS sort_title TEXT;

UPDATE manga_series
SET sort_title = bunko_natural_sort_key(title)
WHERE sort_title IS NULL OR sort_title = '';

UPDATE manga_volumes
SET sort_title = bunko_natural_sort_key(title)
WHERE sort_title IS NULL OR sort_title = '';

ALTER TABLE manga_series
  ALTER COLUMN sort_title SET NOT NULL;

ALTER TABLE manga_volumes
  ALTER COLUMN sort_title SET NOT NULL;

CREATE INDEX IF NOT EXISTS manga_series_sort_title_idx
  ON manga_series (sort_title);

CREATE INDEX IF NOT EXISTS manga_volumes_sort_title_idx
  ON manga_volumes (sort_title);

CREATE INDEX IF NOT EXISTS manga_volumes_series_id_sort_title_idx
  ON manga_volumes (series_id, sort_title);
