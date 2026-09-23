import { createId } from "@paralleldrive/cuid2";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getBookCoverUrl } from "@/lib/books/cover";
import { getMangaCoverUrl } from "@/lib/mangaCover";
import { execute, query, queryOne } from "./query";

export type ClubMemberStatus = "PENDING" | "APPROVED" | "REJECTED" | "REVOKED";
export type ClubCycleStatus = "DRAFT" | "VOTING" | "READING" | "COMPLETED";
export type ClubSourceType = "LIBRARY_SERIES" | "BOOK_SERIES";

export interface ReadingClub {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ownerId: string;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: Date;
  participantCount: number;
  membershipStatus: ClubMemberStatus | null;
  isInvited: boolean;
  workTitle: string | null;
  workCover: string | null;
  workSourceType: ClubSourceType | null;
  workSection: string | null;
  workIsOneshot: boolean;
  workVotes: number | null;
}

export interface ClubMember {
  id: string;
  userId: string;
  username: string;
  name: string | null;
  lastname: string | null;
  role: string;
  status: ClubMemberStatus;
  progress: number | null;
}

export interface ClubUser {
  id: string;
  username: string;
  name: string | null;
  lastname: string | null;
  role: string;
}

export interface ClubCycle {
  id: string;
  title: string;
  status: ClubCycleStatus;
  voteClosesAt: Date | null;
  selectedType: ClubSourceType | null;
  selectedId: string | null;
  workTitle: string | null;
  workCover: string | null;
  startedAt: Date | null;
}

export interface ClubCandidate {
  id: string;
  source_type: ClubSourceType;
  source_id: string;
  title: string | null;
  section: string | null;
  is_oneshot: boolean;
  votes: string;
  cover: string | null;
}

function getWorkCover(row: Record<string, unknown>): string | null {
  if (row.source_type === "LIBRARY_SERIES" && typeof row.library_cover_slug === "string") {
    return getMangaCoverUrl({
      slug: row.library_cover_slug,
      coverImage: row.library_cover_image as string | null,
      updatedAt: row.library_cover_updated_at as Date | string | null,
    });
  }

  if (row.source_type === "BOOK_SERIES" && typeof row.book_cover_slug === "string") {
    return getBookCoverUrl(row.book_cover_slug, row.book_cover_path as string | null);
  }

  return null;
}

function mapClub(row: Record<string, unknown>): ReadingClub {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string | null,
    ownerId: row.owner_id as string,
    status: row.status as ReadingClub["status"],
    createdAt: row.created_at as Date,
    participantCount: Number(row.participant_count ?? 0),
    membershipStatus: (row.membership_status as ClubMemberStatus | null) ?? null,
    isInvited: row.invited_by_user_id !== null && row.invited_by_user_id !== undefined,
    workTitle: (row.work_title as string | null) ?? null,
    workCover: getWorkCover(row),
    workSourceType: (row.source_type as ClubSourceType | null) ?? null,
    workSection: (row.work_section as string | null) ?? null,
    workIsOneshot: row.work_is_oneshot === true,
    workVotes: row.work_votes === null || row.work_votes === undefined ? null : Number(row.work_votes),
  };
}

export async function findClubBySlug(slug: string): Promise<ReadingClub | null> {
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM reading_clubs WHERE slug = $1", [slug]);
  return row ? mapClub(row) : null;
}

export async function listClubsForUser(userId: string, options?: { includePublic?: boolean }): Promise<ReadingClub[]> {
  const rows = await query<Record<string, unknown>>(`
    SELECT c.*, members.participant_count, viewer.status AS membership_status, COALESCE(library_series.title, book_series.title) AS work_title,
      selected.source_type,
      COALESCE(library_series.library_section, book_series.library_section) AS work_section,
      COALESCE(library_series.is_oneshot, book_series.is_oneshot, FALSE) AS work_is_oneshot,
      selected.votes AS work_votes,
      library_cover.slug AS library_cover_slug, library_cover.cover_image AS library_cover_image, library_cover.updated_at AS library_cover_updated_at,
      book_cover.slug AS book_cover_slug, book_cover.cover_path AS book_cover_path
    FROM reading_clubs c
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::text AS participant_count
      FROM reading_club_members member_count
      WHERE member_count.club_id = c.id AND member_count.status = 'APPROVED'
    ) members ON TRUE
    LEFT JOIN LATERAL (
      SELECT membership.status, membership.invited_by_user_id
      FROM reading_club_members membership
      WHERE membership.club_id = c.id AND membership.user_id = $1
    ) viewer ON TRUE
    LEFT JOIN LATERAL (
      SELECT source_type, source_id, votes
      FROM (
        SELECT cycle.selected_type AS source_type, cycle.selected_id AS source_id, 0 AS priority, NULL::int AS votes
        FROM reading_club_cycles cycle
        WHERE cycle.club_id = c.id AND cycle.status = 'READING'

        UNION ALL

        SELECT candidate.source_type, candidate.source_id, 1 AS priority, COUNT(vote.id)::int AS votes
        FROM reading_club_cycles cycle
        INNER JOIN reading_club_candidates candidate ON candidate.cycle_id = cycle.id
        LEFT JOIN reading_club_votes vote ON vote.candidate_id = candidate.id
        WHERE cycle.club_id = c.id AND cycle.status = 'VOTING'
        GROUP BY candidate.id
      ) work
      WHERE source_id IS NOT NULL
      ORDER BY priority, votes DESC, source_id
      LIMIT 1
    ) selected ON TRUE
    LEFT JOIN library_series ON selected.source_type = 'LIBRARY_SERIES' AND library_series.id = selected.source_id
    LEFT JOIN book_series ON selected.source_type = 'BOOK_SERIES' AND book_series.id = selected.source_id
    LEFT JOIN LATERAL (
      SELECT volume.slug, volume.cover_image, volume.updated_at
      FROM library_volumes volume
      WHERE selected.source_type = 'LIBRARY_SERIES' AND volume.series_id = selected.source_id
      ORDER BY volume.created_at
      LIMIT 1
    ) library_cover ON TRUE
    LEFT JOIN LATERAL (
      SELECT volume.slug, metadata.cover_path
      FROM book_volumes volume
      INNER JOIN book_metadata metadata ON metadata.volume_id = volume.id
      WHERE selected.source_type = 'BOOK_SERIES' AND volume.series_id = selected.source_id
      ORDER BY volume.number NULLS FIRST, volume.title
      LIMIT 1
    ) book_cover ON TRUE
    WHERE ($2::boolean AND c.status = 'ACTIVE') OR c.owner_id = $1 OR EXISTS (
      SELECT 1
      FROM reading_club_members membership
      WHERE membership.club_id = c.id AND membership.user_id = $1 AND membership.status = 'APPROVED'
    )
    ORDER BY c.status, c.created_at DESC`, [userId, options?.includePublic ?? false]);
  return rows.map(mapClub);
}

export async function getMembership(clubId: string, userId: string): Promise<{ id: string; status: ClubMemberStatus; invited_by_user_id: string | null } | null> {
  return queryOne<{ id: string; status: ClubMemberStatus; invited_by_user_id: string | null }>(
    "SELECT id, status, invited_by_user_id FROM reading_club_members WHERE club_id = $1 AND user_id = $2", [clubId, userId]);
}

export async function canManageClub(club: ReadingClub, userId: string, isAdmin: boolean): Promise<boolean> {
  return isAdmin || club.ownerId === userId;
}

export async function canAccessClub(club: ReadingClub, userId: string, isAdmin: boolean): Promise<boolean> {
  if (isAdmin || club.ownerId === userId) return true;
  const member = await getMembership(club.id, userId);
  return club.status === "ACTIVE" && member?.status === "APPROVED";
}

export async function createClubRecord(input: { slug: string; name: string; description?: string; ownerId: string }): Promise<ReadingClub> {
  const row = await queryOne<Record<string, unknown>>(`
    INSERT INTO reading_clubs (id, slug, name, description, owner_id)
    VALUES ($1, $2, $3, $4, $5) RETURNING *`,
  [createId(), input.slug, input.name, input.description ?? null, input.ownerId]);
  if (!row) throw new Error("Could not create club");
  return mapClub(row);
}

export function getFixedClubInviteToken(club: ReadingClub) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  const signature = createHmac("sha256", secret).update(`reading-club-invite:${club.id}`).digest("base64url");
  return `${club.slug}.${signature}`;
}

export async function findFixedClubInvite(token: string) {
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;
  const slug = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const club = await findClubBySlug(slug);
  if (!club) return null;
  const expectedToken = getFixedClubInviteToken(club);
  const expectedSignature = expectedToken.slice(expectedToken.lastIndexOf(".") + 1);
  if (signature.length !== expectedSignature.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;
  return { club_id: club.id, club_slug: club.slug, club_name: club.name, club_status: club.status };
}

export async function requestMembership(clubId: string, userId: string): Promise<void> {
  await execute(`INSERT INTO reading_club_members (id, club_id, user_id, status)
    VALUES ($1,$2,$3,'PENDING') ON CONFLICT (club_id, user_id)
    DO UPDATE SET
      status = CASE WHEN reading_club_members.status IN ('REJECTED','REVOKED') THEN 'PENDING' ELSE reading_club_members.status END,
      invited_by_user_id = CASE WHEN reading_club_members.status IN ('REJECTED','REVOKED') THEN NULL ELSE reading_club_members.invited_by_user_id END`,
  [createId(), clubId, userId]);
}

export async function inviteMembership(clubId: string, userId: string, invitedByUserId: string): Promise<void> {
  await execute(`INSERT INTO reading_club_members (id, club_id, user_id, status, invited_by_user_id)
    VALUES ($1,$2,$3,'PENDING',$4) ON CONFLICT (club_id, user_id)
    DO UPDATE SET
      status = CASE WHEN reading_club_members.status IN ('REJECTED','REVOKED') THEN 'PENDING' ELSE reading_club_members.status END,
      invited_by_user_id = CASE WHEN reading_club_members.status IN ('REJECTED','REVOKED') THEN EXCLUDED.invited_by_user_id ELSE reading_club_members.invited_by_user_id END`,
  [createId(), clubId, userId, invitedByUserId]);
}

export async function addApprovedMembership(clubId: string, userId: string): Promise<void> {
  await execute(`INSERT INTO reading_club_members (id, club_id, user_id, status, reviewed_at)
    VALUES ($1,$2,$3,'APPROVED',NOW()) ON CONFLICT (club_id, user_id)
    DO UPDATE SET status = 'APPROVED', reviewed_at = NOW()`,
  [createId(), clubId, userId]);
}

export async function listClubUsers(): Promise<ClubUser[]> {
  return query<ClubUser>(`SELECT id, username, name, lastname, role
    FROM users
    WHERE disabled_at IS NULL AND role <> 'GUEST'
    ORDER BY COALESCE(name, username) ASC, username ASC`);
}

export async function deleteGuestWithoutActiveClubs(userId: string): Promise<void> {
  await execute(`DELETE FROM users
    WHERE id = $1
      AND role = 'GUEST'
      AND NOT EXISTS (
        SELECT 1
        FROM reading_club_members member
        INNER JOIN reading_clubs club ON club.id = member.club_id
        WHERE member.user_id = users.id
          AND member.status IN ('PENDING', 'APPROVED')
          AND club.status = 'ACTIVE'
      )`, [userId]);
}

async function deleteGuestsWithoutActiveClubs(): Promise<void> {
  await execute(`DELETE FROM users
    WHERE role = 'GUEST'
      AND NOT EXISTS (
        SELECT 1
        FROM reading_club_members member
        INNER JOIN reading_clubs club ON club.id = member.club_id
        WHERE member.user_id = users.id
          AND member.status IN ('PENDING', 'APPROVED')
          AND club.status = 'ACTIVE'
      )`);
}

export async function reviewMembership(memberId: string, status: Extract<ClubMemberStatus, "APPROVED" | "REJECTED" | "REVOKED">): Promise<void> {
  await execute("UPDATE reading_club_members SET status = $2, reviewed_at = NOW() WHERE id = $1", [memberId, status]);
}

export async function createCycleRecord(clubId: string, title: string, voteClosesAt: Date | null): Promise<ClubCycle> {
  const row = await queryOne<Record<string, unknown>>(`INSERT INTO reading_club_cycles (id, club_id, title, status, vote_closes_at)
    VALUES ($1,$2,$3,$4,$5) RETURNING id,title,status,vote_closes_at,selected_type,selected_id,started_at`,
  [createId(), clubId, title, "DRAFT", voteClosesAt]);
  if (!row) throw new Error("Could not create cycle");
  return mapCycle(row);
}

function mapCycle(row: Record<string, unknown>): ClubCycle {
  return {
    id: row.id as string,
    title: row.title as string,
    status: row.status as ClubCycleStatus,
    voteClosesAt: row.vote_closes_at as Date | null,
    selectedType: row.selected_type as ClubSourceType | null,
    selectedId: row.selected_id as string | null,
    workTitle: (row.work_title as string | null) ?? null,
    workCover: getWorkCover(row),
    startedAt: row.started_at as Date | null,
  };
}

export async function addCandidateRecord(cycleId: string, sourceType: ClubSourceType, sourceId: string): Promise<void> {
  await execute("INSERT INTO reading_club_candidates (id, cycle_id, source_type, source_id) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING", [createId(), cycleId, sourceType, sourceId]);
}

export async function replaceCycleCandidates(cycleId: string, candidates: Array<{ sourceType: ClubSourceType; sourceId: string }>): Promise<void> {
  await execute("DELETE FROM reading_club_candidates WHERE cycle_id=$1", [cycleId]);
  for (const candidate of candidates) await addCandidateRecord(cycleId, candidate.sourceType, candidate.sourceId);
}

export async function removeCandidateRecord(candidateId: string, cycleId: string): Promise<void> {
  await execute("DELETE FROM reading_club_candidates WHERE id=$1 AND cycle_id=$2", [candidateId, cycleId]);
}

export async function selectCycleWork(cycleId: string, sourceType: ClubSourceType, sourceId: string): Promise<void> {
  await execute(`UPDATE reading_club_cycles SET selected_type=$2, selected_id=$3, status='READING', started_at=COALESCE(started_at,NOW()), updated_at=NOW() WHERE id=$1`, [cycleId, sourceType, sourceId]);
}

export async function addMilestoneRecord(cycleId: string, position: number, label: string, targetDate: string): Promise<void> {
  await execute("INSERT INTO reading_club_milestones (id,cycle_id,position,label,target_date) VALUES ($1,$2,$3,$4,$5)", [createId(), cycleId, position, label, targetDate]);
}

export async function castVoteRecord(cycleId: string, candidateId: string, memberId: string): Promise<void> {
  await execute(`INSERT INTO reading_club_votes (id,cycle_id,candidate_id,member_id) VALUES ($1,$2,$3,$4)
    ON CONFLICT (cycle_id, member_id) DO UPDATE SET candidate_id=EXCLUDED.candidate_id, created_at=NOW()`, [createId(), cycleId, candidateId, memberId]);
}

export async function archiveClubRecord(clubId: string): Promise<void> {
  await execute("UPDATE reading_clubs SET status='ARCHIVED', archived_at=NOW(), updated_at=NOW() WHERE id=$1", [clubId]);
  await deleteGuestsWithoutActiveClubs();
}

export async function deleteClubRecord(clubId: string): Promise<void> {
  await execute("DELETE FROM reading_clubs WHERE id=$1", [clubId]);
  await deleteGuestsWithoutActiveClubs();
}

export async function getClubDashboard(club: ReadingClub, userId: string) {
  const [members, cycles, activities] = await Promise.all([
    query<Record<string, unknown>>(`SELECT m.id,m.user_id,u.username,u.name,u.lastname,u.role,m.status
      FROM reading_club_members m INNER JOIN users u ON u.id=m.user_id WHERE m.club_id=$1 AND m.status <> 'REVOKED' ORDER BY m.status, COALESCE(u.name,u.username)`, [club.id]),
    query<Record<string, unknown>>(`SELECT c.id,c.title,c.status,c.vote_closes_at,c.selected_type,c.selected_type AS source_type,c.selected_id,c.started_at,
      COALESCE(ls.title,bs.title) AS work_title,
      library_cover.slug AS library_cover_slug, library_cover.cover_image AS library_cover_image, library_cover.updated_at AS library_cover_updated_at,
      book_cover.slug AS book_cover_slug, book_cover.cover_path AS book_cover_path
      FROM reading_club_cycles c
      LEFT JOIN library_series ls ON c.selected_type='LIBRARY_SERIES' AND ls.id=c.selected_id
      LEFT JOIN book_series bs ON c.selected_type='BOOK_SERIES' AND bs.id=c.selected_id
      LEFT JOIN LATERAL (
        SELECT volume.slug, volume.cover_image, volume.updated_at
        FROM library_volumes volume
        WHERE c.selected_type='LIBRARY_SERIES' AND volume.series_id=c.selected_id
        ORDER BY volume.created_at
        LIMIT 1
      ) library_cover ON TRUE
      LEFT JOIN LATERAL (
        SELECT volume.slug, metadata.cover_path
        FROM book_volumes volume
        INNER JOIN book_metadata metadata ON metadata.volume_id=volume.id
        WHERE c.selected_type='BOOK_SERIES' AND volume.series_id=c.selected_id
        ORDER BY volume.number NULLS FIRST, volume.title
        LIMIT 1
      ) book_cover ON TRUE
      WHERE c.club_id=$1 ORDER BY c.created_at DESC`, [club.id]),
    query<{ id: string; type: string; created_at: Date; username: string; name: string | null; lastname: string | null; label: string | null }>(`
      SELECT a.id,a.type,a.created_at,u.username,u.name,u.lastname,ms.label FROM reading_club_activities a
      INNER JOIN reading_club_members m ON m.id=a.member_id INNER JOIN users u ON u.id=m.user_id
      LEFT JOIN reading_club_milestones ms ON ms.id=a.milestone_id WHERE a.club_id=$1 ORDER BY a.created_at DESC LIMIT 50`, [club.id]),
  ]);
  const active = cycles.map(mapCycle).find((cycle) => cycle.status === "READING") ?? null;
  const memberProgress = await listMemberProgress(active, members.map((member) => ({ id: member.id as string, userId: member.user_id as string })));
  return {
    club,
    currentUserMembership: await getMembership(club.id, userId),
    members: members.map((member) => ({ id: member.id as string, userId: member.user_id as string, username: member.username as string, name: member.name as string | null, lastname: member.lastname as string | null, role: member.role as string, status: member.status as ClubMemberStatus, progress: memberProgress.get(member.user_id as string) ?? null } satisfies ClubMember)),
    cycles: cycles.map(mapCycle),
    activities,
  };
}

async function listMemberProgress(cycle: ClubCycle | null, members: { id: string; userId: string }[]): Promise<Map<string, number>> {
  if (!cycle?.selectedId || !cycle.selectedType || !members.length) return new Map();
  const userIds = members.map((member) => member.userId);
  const rows = cycle.selectedType === "LIBRARY_SERIES"
    ? await query<{ user_id: string; progress: number }>(`SELECT ids.user_id, AVG(CASE WHEN u.is_read THEN 1 WHEN u.total_pages > 0 THEN LEAST(1, GREATEST(0, (u.last_page + 1)::float / u.total_pages)) ELSE 0 END) AS progress
      FROM unnest($2::text[]) AS ids(user_id) CROSS JOIN library_volumes v
      LEFT JOIN user_to_volumes u ON u.volume_id=v.id AND u.user_id=ids.user_id
      WHERE v.series_id=$1 GROUP BY ids.user_id`, [cycle.selectedId, userIds])
    : await query<{ user_id: string; progress: number }>(`SELECT ids.user_id, AVG(CASE WHEN u.is_read THEN 1 ELSE COALESCE(u.progression,0) END) AS progress
      FROM unnest($2::text[]) AS ids(user_id) CROSS JOIN book_volumes v
      LEFT JOIN user_to_books u ON u.volume_id=v.id AND u.user_id=ids.user_id
      WHERE v.series_id=$1 GROUP BY ids.user_id`, [cycle.selectedId, userIds]);
  return new Map(rows.map((row) => [row.user_id, Number(row.progress)]));
}

export async function listClubWorks() {
  const [library, books] = await Promise.all([
    query<{ id: string; title: string; section: string; is_oneshot: boolean }>("SELECT id,title,library_section AS section,is_oneshot FROM library_series WHERE library_section IN ('manga','comic') ORDER BY title"),
    query<{ id: string; title: string; section: string; is_oneshot: boolean }>("SELECT id,title,'books' AS section,is_oneshot FROM book_series WHERE library_section='books' ORDER BY title"),
  ]);
  return [...library.map((work) => ({ ...work, type: "LIBRARY_SERIES" as const })), ...books.map((work) => ({ ...work, type: "BOOK_SERIES" as const }))];
}

export async function listCycleCandidates(cycleId: string): Promise<ClubCandidate[]> {
  const rows = await query<Record<string, unknown>>(`
    SELECT ca.id,ca.source_type,ca.source_id,COALESCE(ls.title,bs.title) AS title,COALESCE(ls.library_section,bs.library_section) AS section,COALESCE(ls.is_oneshot,bs.is_oneshot,FALSE) AS is_oneshot,
      vote_count.votes,
      library_cover.slug AS library_cover_slug, library_cover.cover_image AS library_cover_image, library_cover.updated_at AS library_cover_updated_at,
      book_cover.slug AS book_cover_slug, book_cover.cover_path AS book_cover_path
    FROM reading_club_candidates ca LEFT JOIN library_series ls ON ca.source_type='LIBRARY_SERIES' AND ls.id=ca.source_id
    LEFT JOIN book_series bs ON ca.source_type='BOOK_SERIES' AND bs.id=ca.source_id
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::text AS votes
      FROM reading_club_votes vote
      WHERE vote.candidate_id=ca.id
    ) vote_count ON TRUE
    LEFT JOIN LATERAL (
      SELECT volume.slug, volume.cover_image, volume.updated_at
      FROM library_volumes volume
      WHERE ca.source_type='LIBRARY_SERIES' AND volume.series_id=ca.source_id
      ORDER BY volume.created_at
      LIMIT 1
    ) library_cover ON TRUE
    LEFT JOIN LATERAL (
      SELECT volume.slug, metadata.cover_path
      FROM book_volumes volume
      INNER JOIN book_metadata metadata ON metadata.volume_id=volume.id
      WHERE ca.source_type='BOOK_SERIES' AND volume.series_id=ca.source_id
      ORDER BY volume.number NULLS FIRST, volume.title
      LIMIT 1
    ) book_cover ON TRUE
    WHERE ca.cycle_id=$1
    ORDER BY title`, [cycleId]);

  return rows.map((row) => ({
    id: row.id as string,
    source_type: row.source_type as ClubSourceType,
    source_id: row.source_id as string,
    title: row.title as string | null,
    section: row.section as string | null,
    is_oneshot: row.is_oneshot === true,
    votes: row.votes as string,
    cover: getWorkCover(row),
  }));
}

export async function listCycleMilestones(cycleId: string) {
  return query<{ id: string; position: number; label: string; target_date: string }>(
    "SELECT id,position,label,target_date::text FROM reading_club_milestones WHERE cycle_id=$1 ORDER BY position", [cycleId]);
}

export async function listSelectedCycleVolumes(cycle: ClubCycle | null) {
  if (!cycle?.selectedId || !cycle.selectedType) return [];
  if (cycle.selectedType === "LIBRARY_SERIES") return query<{ slug: string; title: string; kind: "manga"; manga_style: string | null }>(`
    SELECT v.slug,v.title,'manga'::text AS kind,md.manga_style FROM library_volumes v
    LEFT JOIN volume_metadata md ON md.id=v.metadata_id WHERE v.series_id=$1 ORDER BY v.created_at`, [cycle.selectedId]);
  return query<{ slug: string; title: string; kind: "books"; manga_style: null }>(`
    SELECT slug,title,'books'::text AS kind,NULL::text AS manga_style FROM book_volumes WHERE series_id=$1 ORDER BY number NULLS FIRST,title`, [cycle.selectedId]);
}

export async function recordClubProgressActivities(userId: string, sourceType: ClubSourceType, sourceId: string): Promise<void> {
  const progressRow = sourceType === "LIBRARY_SERIES"
    ? await queryOne<{ progress: number }>(`SELECT AVG(CASE WHEN u.is_read THEN 1 WHEN u.total_pages > 0 THEN LEAST(1, GREATEST(0, (u.last_page + 1)::float / u.total_pages)) ELSE 0 END) AS progress
      FROM library_volumes v LEFT JOIN user_to_volumes u ON u.volume_id=v.id AND u.user_id=$1 WHERE v.series_id=$2`, [userId, sourceId])
    : await queryOne<{ progress: number }>(`SELECT AVG(CASE WHEN u.is_read THEN 1 ELSE COALESCE(u.progression,0) END) AS progress
      FROM book_volumes v LEFT JOIN user_to_books u ON u.volume_id=v.id AND u.user_id=$1 WHERE v.series_id=$2`, [userId, sourceId]);
  const progress = Number(progressRow?.progress ?? 0);
  const rows = await query<{ club_id: string; cycle_id: string; member_id: string; milestone_id: string | null; position: number }>(`
    SELECT c.club_id,c.id AS cycle_id,m.id AS member_id,ms.id AS milestone_id,ms.position
    FROM reading_club_cycles c INNER JOIN reading_club_members m ON m.club_id=c.club_id AND m.user_id=$1 AND m.status='APPROVED'
    LEFT JOIN reading_club_milestones ms ON ms.cycle_id=c.id
    WHERE c.status='READING' AND c.selected_type=$2 AND c.selected_id=$3`, [userId, sourceType, sourceId]);
  for (const row of rows) {
    if (progress >= 1) await execute(`INSERT INTO reading_club_activities (id,club_id,cycle_id,member_id,type) VALUES ($1,$2,$3,$4,'COMPLETED') ON CONFLICT DO NOTHING`, [createId(), row.club_id, row.cycle_id, row.member_id]);
    if (row.milestone_id && progress * 100 >= row.position) await execute(`INSERT INTO reading_club_activities (id,club_id,cycle_id,member_id,milestone_id,type) VALUES ($1,$2,$3,$4,$5,'MILESTONE_REACHED') ON CONFLICT DO NOTHING`, [createId(), row.club_id, row.cycle_id, row.member_id, row.milestone_id]);
  }
}
