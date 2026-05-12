CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  name TEXT,
  lastname TEXT,
  birth_year INTEGER
);

CREATE TABLE IF NOT EXISTS reading_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  goal INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year)
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
  device_name TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx
  ON push_subscriptions (user_id);

CREATE TABLE IF NOT EXISTS manga_series (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  path TEXT NOT NULL,
  is_oneshot BOOLEAN NOT NULL DEFAULT FALSE,
  mtime TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'FINISHED',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS volume_metadata (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,
  title TEXT,
  series TEXT,
  number DOUBLE PRECISION,
  count INTEGER,
  summary TEXT,
  year INTEGER,
  month INTEGER,
  day INTEGER,
  writer TEXT,
  penciller TEXT,
  inker TEXT,
  colorist TEXT,
  letterer TEXT,
  cover_artist TEXT,
  editor TEXT,
  publisher TEXT,
  imprint TEXT,
  web TEXT,
  page_count INTEGER,
  language_iso TEXT,
  format TEXT,
  manga_style TEXT,
  age_rating TEXT,
  community_rating DOUBLE PRECISION,
  gtin TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manga_volumes (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  full_path TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  mtime TIMESTAMP NOT NULL DEFAULT NOW(),
  cover_image TEXT,
  series_id TEXT NOT NULL REFERENCES manga_series(id) ON DELETE CASCADE,
  metadata_id TEXT UNIQUE REFERENCES volume_metadata(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS manga_volumes_series_id_idx
  ON manga_volumes (series_id);

CREATE TABLE IF NOT EXISTS user_to_series (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  series_id TEXT NOT NULL REFERENCES manga_series(id) ON DELETE CASCADE,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, series_id)
);

CREATE INDEX IF NOT EXISTS user_to_series_user_id_idx
  ON user_to_series (user_id);

CREATE INDEX IF NOT EXISTS user_to_series_series_id_idx
  ON user_to_series (series_id);

CREATE TABLE IF NOT EXISTS user_to_volumes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  volume_id TEXT NOT NULL REFERENCES manga_volumes(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  personal_rating DOUBLE PRECISION,
  last_page INTEGER,
  total_pages INTEGER,
  last_read_at TIMESTAMP,
  first_read TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, volume_id)
);

CREATE INDEX IF NOT EXISTS user_to_volumes_user_id_idx
  ON user_to_volumes (user_id);

CREATE INDEX IF NOT EXISTS user_to_volumes_volume_id_idx
  ON user_to_volumes (volume_id);

CREATE TABLE IF NOT EXISTS daily_reading_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS daily_reading_logs_user_id_idx
  ON daily_reading_logs (user_id);

CREATE TABLE IF NOT EXISTS reading_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  volume_id TEXT NOT NULL REFERENCES manga_volumes(id) ON DELETE CASCADE,
  read_at TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reading_entries_user_id_volume_id_idx
  ON reading_entries (user_id, volume_id);

CREATE INDEX IF NOT EXISTS reading_entries_volume_id_idx
  ON reading_entries (volume_id);

CREATE TABLE IF NOT EXISTS file_checksums (
  id TEXT PRIMARY KEY,
  file_path TEXT UNIQUE,
  checksum TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS genres (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS volume_to_genres (
  id TEXT PRIMARY KEY,
  volume_id TEXT NOT NULL REFERENCES manga_volumes(id) ON DELETE CASCADE,
  genre_id TEXT NOT NULL REFERENCES genres(id),
  UNIQUE (volume_id, genre_id)
);

CREATE INDEX IF NOT EXISTS volume_to_genres_volume_id_idx
  ON volume_to_genres (volume_id);

CREATE INDEX IF NOT EXISTS volume_to_genres_genre_id_idx
  ON volume_to_genres (genre_id);

CREATE TABLE IF NOT EXISTS volume_to_tags (
  id TEXT PRIMARY KEY,
  volume_id TEXT NOT NULL REFERENCES manga_volumes(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id),
  UNIQUE (volume_id, tag_id)
);

CREATE INDEX IF NOT EXISTS volume_to_tags_volume_id_idx
  ON volume_to_tags (volume_id);

CREATE INDEX IF NOT EXISTS volume_to_tags_tag_id_idx
  ON volume_to_tags (tag_id);
