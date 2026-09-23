ALTER TABLE reading_club_members
  ADD COLUMN IF NOT EXISTS invited_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
