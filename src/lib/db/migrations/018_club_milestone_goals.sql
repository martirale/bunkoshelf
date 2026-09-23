ALTER TABLE reading_club_milestones
  ALTER COLUMN position DROP NOT NULL;

ALTER TABLE reading_club_milestones
  DROP CONSTRAINT IF EXISTS reading_club_milestones_cycle_id_position_key;
