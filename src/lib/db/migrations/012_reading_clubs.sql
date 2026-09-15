ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS reading_clubs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  archived_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reading_club_members (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES reading_clubs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  UNIQUE (club_id, user_id)
);

CREATE TABLE IF NOT EXISTS reading_club_invites (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES reading_clubs(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reading_club_guest_accounts (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  club_id TEXT NOT NULL REFERENCES reading_clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reading_club_cycles (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES reading_clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'VOTING', 'READING', 'COMPLETED')),
  vote_closes_at TIMESTAMP,
  selected_type TEXT CHECK (selected_type IN ('LIBRARY_SERIES', 'BOOK_SERIES')),
  selected_id TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reading_club_candidates (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL REFERENCES reading_club_cycles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('LIBRARY_SERIES', 'BOOK_SERIES')),
  source_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (cycle_id, source_type, source_id)
);

CREATE TABLE IF NOT EXISTS reading_club_votes (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL REFERENCES reading_club_cycles(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL REFERENCES reading_club_candidates(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES reading_club_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (cycle_id, member_id)
);

CREATE TABLE IF NOT EXISTS reading_club_milestones (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL REFERENCES reading_club_cycles(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 100),
  label TEXT NOT NULL,
  target_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (cycle_id, position)
);

CREATE TABLE IF NOT EXISTS reading_club_activities (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES reading_clubs(id) ON DELETE CASCADE,
  cycle_id TEXT NOT NULL REFERENCES reading_club_cycles(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES reading_club_members(id) ON DELETE CASCADE,
  milestone_id TEXT REFERENCES reading_club_milestones(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('MILESTONE_REACHED', 'COMPLETED')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reading_club_members_user_idx ON reading_club_members(user_id, status);
CREATE INDEX IF NOT EXISTS reading_club_cycles_club_idx ON reading_club_cycles(club_id, status);
CREATE INDEX IF NOT EXISTS reading_club_activities_cycle_idx ON reading_club_activities(cycle_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS reading_club_activities_milestone_unique
  ON reading_club_activities(cycle_id, member_id, milestone_id)
  WHERE type = 'MILESTONE_REACHED';
CREATE UNIQUE INDEX IF NOT EXISTS reading_club_activities_completed_unique
  ON reading_club_activities(cycle_id, member_id)
  WHERE type = 'COMPLETED';
