CREATE TABLE IF NOT EXISTS book_series (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  sort_title TEXT NOT NULL,
  path TEXT NOT NULL,
  is_oneshot BOOLEAN NOT NULL DEFAULT FALSE,
  mtime TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'FINISHED',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS book_metadata (
  id TEXT PRIMARY KEY,
  volume_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  publisher TEXT,
  published_at TEXT,
  language TEXT,
  rights TEXT,
  source TEXT,
  publication_type TEXT,
  modified_at TEXT,
  package_path TEXT NOT NULL,
  navigation_path TEXT,
  cover_path TEXT,
  rendition_layout TEXT NOT NULL DEFAULT 'reflowable',
  rendition_flow TEXT,
  rendition_orientation TEXT,
  rendition_spread TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS book_volumes (
  id TEXT PRIMARY KEY,
  series_id TEXT NOT NULL REFERENCES book_series(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  sort_title TEXT NOT NULL,
  filename TEXT NOT NULL,
  full_path TEXT NOT NULL UNIQUE,
  size BIGINT NOT NULL DEFAULT 0,
  mtime TIMESTAMP NOT NULL DEFAULT NOW(),
  cover_image TEXT,
  number DOUBLE PRECISION,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE book_metadata
  ADD CONSTRAINT book_metadata_volume_id_fkey
  FOREIGN KEY (volume_id) REFERENCES book_volumes(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS book_identifiers (
  id TEXT PRIMARY KEY,
  metadata_id TEXT NOT NULL REFERENCES book_metadata(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  scheme TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (metadata_id, value)
);

CREATE TABLE IF NOT EXISTS book_people (
  id TEXT PRIMARY KEY,
  metadata_id TEXT NOT NULL REFERENCES book_metadata(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('creator', 'contributor')),
  sort_name TEXT,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS book_subjects (
  id TEXT PRIMARY KEY,
  metadata_id TEXT NOT NULL REFERENCES book_metadata(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scheme TEXT,
  UNIQUE (metadata_id, name)
);

CREATE TABLE IF NOT EXISTS book_file_checksums (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_to_books (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  volume_id TEXT NOT NULL REFERENCES book_volumes(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  personal_rating DOUBLE PRECISION,
  cfi TEXT,
  progression DOUBLE PRECISION,
  chapter_href TEXT,
  chapter_label TEXT,
  last_read_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, volume_id)
);

CREATE TABLE IF NOT EXISTS book_bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  volume_id TEXT NOT NULL REFERENCES book_volumes(id) ON DELETE CASCADE,
  cfi TEXT NOT NULL,
  label TEXT,
  chapter_label TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS book_annotations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  volume_id TEXT NOT NULL REFERENCES book_volumes(id) ON DELETE CASCADE,
  cfi_range TEXT NOT NULL,
  excerpt TEXT,
  note TEXT,
  color TEXT NOT NULL DEFAULT 'yellow',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS book_reading_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  volume_id TEXT NOT NULL REFERENCES book_volumes(id) ON DELETE CASCADE,
  read_at TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_book_reader_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'light',
  flow TEXT NOT NULL DEFAULT 'paginated',
  font_family TEXT NOT NULL DEFAULT 'serif',
  font_size INTEGER NOT NULL DEFAULT 100,
  line_height DOUBLE PRECISION NOT NULL DEFAULT 1.6,
  margin INTEGER NOT NULL DEFAULT 24,
  column_width INTEGER NOT NULL DEFAULT 720,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS book_volumes_series_id_idx ON book_volumes(series_id);
CREATE INDEX IF NOT EXISTS user_to_books_user_id_idx ON user_to_books(user_id);
CREATE INDEX IF NOT EXISTS user_to_books_volume_id_idx ON user_to_books(volume_id);
CREATE INDEX IF NOT EXISTS book_bookmarks_user_volume_idx ON book_bookmarks(user_id, volume_id);
CREATE INDEX IF NOT EXISTS book_annotations_user_volume_idx ON book_annotations(user_id, volume_id);
CREATE INDEX IF NOT EXISTS book_reading_entries_user_volume_idx ON book_reading_entries(user_id, volume_id);
