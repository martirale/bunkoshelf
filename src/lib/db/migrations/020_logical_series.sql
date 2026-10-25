ALTER TABLE library_series ADD COLUMN is_logical BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE book_series ADD COLUMN is_logical BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE VIEW manga_series AS SELECT * FROM library_series;

CREATE TABLE logical_series_members (
  logical_series_id TEXT NOT NULL REFERENCES library_series(id) ON DELETE CASCADE,
  series_id TEXT NOT NULL UNIQUE REFERENCES library_series(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position > 0),
  PRIMARY KEY (logical_series_id, series_id),
  UNIQUE (logical_series_id, position),
  CHECK (logical_series_id <> series_id)
);

CREATE TABLE logical_book_series_members (
  logical_series_id TEXT NOT NULL REFERENCES book_series(id) ON DELETE CASCADE,
  series_id TEXT NOT NULL UNIQUE REFERENCES book_series(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position > 0),
  PRIMARY KEY (logical_series_id, series_id),
  UNIQUE (logical_series_id, position),
  CHECK (logical_series_id <> series_id)
);

CREATE VIEW library_series_volumes AS
  SELECT series_id, id AS volume_id, 0 AS position FROM library_volumes
  UNION ALL
  SELECT m.logical_series_id, v.id, m.position
  FROM logical_series_members m
  JOIN library_volumes v ON v.series_id = m.series_id;

CREATE VIEW book_series_volumes AS
  SELECT series_id, id AS volume_id, 0 AS position FROM book_volumes
  UNION ALL
  SELECT m.logical_series_id, v.id, m.position
  FROM logical_book_series_members m
  JOIN book_volumes v ON v.series_id = m.series_id;
