import { getAppSettings } from "@/lib/db/appSettings";
import { query, queryOne } from "@/lib/db/query";
import { canViewAgeRating, getContentVisibilityPolicy } from "@/lib/parentalControl";
import type { Session } from "@/lib/types";

type ClubSourceType = "LIBRARY_SERIES" | "BOOK_SERIES";

interface PolicyUserRow {
  id: string;
  username: string;
  is_admin: boolean;
  role: Session["role"];
  name: string | null;
  lastname: string | null;
  birth_year: number | null;
  birth_month: number | null;
  birth_day: number | null;
  parental_control_enabled: boolean;
  parental_control_mode: "flexible" | "strict";
  profile_image: string | null;
}

function mapPolicyUser(user: PolicyUserRow): Session {
  return {
    id: user.id,
    username: user.username,
    isAdmin: user.is_admin,
    role: user.role,
    name: user.name,
    lastname: user.lastname,
    birthYear: user.birth_year,
    birthMonth: user.birth_month,
    birthDay: user.birth_day,
    parentalControlEnabled: user.parental_control_enabled,
    parentalControlMode: user.parental_control_mode,
    profileImage: user.profile_image,
  };
}

async function getPolicyUser(userId: string): Promise<Session | null> {
  const user = await queryOne<PolicyUserRow>(`SELECT id,username,is_admin,role,name,lastname,
    birth_year,birth_month,birth_day,parental_control_enabled,parental_control_mode,profile_image
    FROM users WHERE id=$1 AND disabled_at IS NULL`, [userId]);
  return user ? mapPolicyUser(user) : null;
}

async function getClubPolicyUsers(clubId: string): Promise<Session[]> {
  const users = await query<PolicyUserRow>(`SELECT u.id,u.username,u.is_admin,u.role,u.name,u.lastname,
    u.birth_year,u.birth_month,u.birth_day,u.parental_control_enabled,u.parental_control_mode,u.profile_image
    FROM reading_club_members member
    INNER JOIN users u ON u.id=member.user_id
    WHERE member.club_id=$1 AND member.status='APPROVED' AND u.disabled_at IS NULL`, [clubId]);
  return users.map(mapPolicyUser);
}

async function getWorkAgeRatings(sourceType: ClubSourceType, sourceId: string): Promise<string[]> {
  if (sourceType === "LIBRARY_SERIES") {
    const ratings = await query<{ age_rating: string | null }>(`SELECT metadata.age_rating
      FROM library_volumes volume
      LEFT JOIN volume_metadata metadata ON metadata.id=volume.metadata_id
      WHERE volume.series_id=$1`, [sourceId]);
    return ratings.map((rating) => rating.age_rating ?? "");
  }

  const ratings = await query<{ age_rating: string | null }>(`SELECT metadata.age_rating
    FROM book_volumes volume
    LEFT JOIN book_metadata metadata ON metadata.volume_id=volume.id
    WHERE volume.series_id=$1`, [sourceId]);
  return ratings.map((rating) => rating.age_rating ?? "");
}

function canViewWork(user: Session, sourceType: ClubSourceType, ratings: string[], globallyEnabled: boolean, globalMode: "flexible" | "strict"): boolean {
  const policy = getContentVisibilityPolicy(user, globallyEnabled, globalMode);
  const library = sourceType === "BOOK_SERIES" ? "book" : "manga";
  return ratings.length > 0 && ratings.every((rating) => canViewAgeRating(rating, library, policy));
}

export async function canClubMembersAccessWork(clubId: string, sourceType: ClubSourceType, sourceId: string): Promise<boolean> {
  const settings = await getAppSettings();
  if (!settings.parentalControlEnabled) return true;
  const [users, ratings] = await Promise.all([
    getClubPolicyUsers(clubId),
    getWorkAgeRatings(sourceType, sourceId),
  ]);
  return users.every((user) => canViewWork(user, sourceType, ratings, settings.parentalControlEnabled, settings.parentalControlMode));
}

export async function canUserAccessClubReading(userId: string, clubId: string): Promise<boolean> {
  const settings = await getAppSettings();
  if (!settings.parentalControlEnabled) return true;
  const [user, cycles] = await Promise.all([
    getPolicyUser(userId),
    query<{ selected_type: ClubSourceType; selected_id: string }>(`SELECT selected_type,selected_id
      FROM reading_club_cycles
      WHERE club_id=$1 AND status='READING' AND selected_type IS NOT NULL AND selected_id IS NOT NULL`, [clubId]),
  ]);
  if (!user) return false;
  const ratings = await Promise.all(cycles.map((cycle) => getWorkAgeRatings(cycle.selected_type, cycle.selected_id)));
  return cycles.every((cycle, index) => canViewWork(user, cycle.selected_type, ratings[index], settings.parentalControlEnabled, settings.parentalControlMode));
}

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
