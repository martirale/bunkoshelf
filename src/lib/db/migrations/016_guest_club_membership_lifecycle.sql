DROP TABLE IF EXISTS reading_club_guest_accounts;

ALTER TABLE user_to_series DROP CONSTRAINT IF EXISTS user_to_series_user_id_fkey;
ALTER TABLE user_to_series
  ADD CONSTRAINT user_to_series_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_to_volumes DROP CONSTRAINT IF EXISTS user_to_volumes_user_id_fkey;
ALTER TABLE user_to_volumes
  ADD CONSTRAINT user_to_volumes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

DELETE FROM users
WHERE role = 'GUEST'
  AND NOT EXISTS (
    SELECT 1
    FROM reading_club_members member
    INNER JOIN reading_clubs club ON club.id = member.club_id
    WHERE member.user_id = users.id
      AND member.status IN ('PENDING', 'APPROVED')
      AND club.status = 'ACTIVE'
  );
