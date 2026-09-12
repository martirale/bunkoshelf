CREATE TABLE IF NOT EXISTS user_to_book_series (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  series_id TEXT NOT NULL REFERENCES book_series(id) ON DELETE CASCADE,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, series_id)
);

CREATE INDEX IF NOT EXISTS user_to_book_series_user_id_idx
  ON user_to_book_series (user_id);

CREATE INDEX IF NOT EXISTS user_to_book_series_series_id_idx
  ON user_to_book_series (series_id);
