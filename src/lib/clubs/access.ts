import { queryOne } from "@/lib/db/query";
import type { Session } from "@/lib/types";

export async function canAccessLibraryVolume(user: Session, volumeId: string): Promise<boolean> {
  if (user.role !== "GUEST") return true;
  const row = await queryOne<{ id: string }>(`
    SELECT c.id FROM reading_club_cycles c
    INNER JOIN reading_club_members m ON m.club_id=c.club_id AND m.user_id=$1 AND m.status='APPROVED'
    INNER JOIN reading_clubs club ON club.id=c.club_id AND club.status='ACTIVE'
    INNER JOIN library_volumes v ON v.series_id=c.selected_id
    WHERE c.status='READING' AND c.selected_type='LIBRARY_SERIES' AND v.id=$2 LIMIT 1`, [user.id, volumeId]);
  return !!row;
}

export async function canAccessBookVolume(user: Session, volumeId: string): Promise<boolean> {
  if (user.role !== "GUEST") return true;
  const row = await queryOne<{ id: string }>(`
    SELECT c.id FROM reading_club_cycles c
    INNER JOIN reading_club_members m ON m.club_id=c.club_id AND m.user_id=$1 AND m.status='APPROVED'
    INNER JOIN reading_clubs club ON club.id=c.club_id AND club.status='ACTIVE'
    INNER JOIN book_volumes v ON v.series_id=c.selected_id
    WHERE c.status='READING' AND c.selected_type='BOOK_SERIES' AND v.id=$2 LIMIT 1`, [user.id, volumeId]);
  return !!row;
}
