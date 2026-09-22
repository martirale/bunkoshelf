"use server";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";
import { verifySession } from "@/lib/auth/verifySession";
import { createUserRecord, usernameExists } from "@/lib/db/users";
import { execute, queryOne } from "@/lib/db/query";
import { canClubMembersAccessWork, canUserAccessClubReading } from "@/lib/clubs/access";
import {
  addCandidateRecord,
  addApprovedMembership,
  addMilestoneRecord,
  archiveClubRecord,
  canAccessClub,
  canManageClub,
  castVoteRecord,
  createClubRecord,
  createCycleRecord,
  deleteGuestWithoutActiveClubs,
  deleteClubRecord,
  findClubBySlug,
  findFixedClubInvite,
  getMembership,
  removeCandidateRecord,
  replaceCycleCandidates,
  requestMembership,
  reviewMembership,
  selectCycleWork,
  type ClubSourceType,
} from "@/lib/db/clubs";

type Result = { success: true } | { success: false; error: string };

function slugify(value: string) {
  return value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

async function manager(slug: string) {
  const user = await verifySession();
  const club = await findClubBySlug(slug);
  if (!user || !club || !(await canManageClub(club, user.id, user.isAdmin))) return null;
  return { user, club };
}

async function belongsToClub(cycleId: string, clubId: string) {
  return !!(await queryOne<{ id: string }>("SELECT id FROM reading_club_cycles WHERE id=$1 AND club_id=$2", [cycleId, clubId]));
}

export async function createClub(input: { name: string; description?: string }): Promise<Result & { slug?: string }> {
  const user = await verifySession();
  const name = input.name.trim();
  if (!user || user.role === "GUEST") return { success: false, error: "Unauthorized" };
  if (name.length < 2 || name.length > 100) return { success: false, error: "Invalid club name" };
  const slug = `${slugify(name) || "club"}-${createId().slice(-6)}`;
  const club = await createClubRecord({ slug, name, description: input.description?.trim(), ownerId: user.id });
  await requestMembership(club.id, user.id);
  const membership = await getMembership(club.id, user.id);
  if (membership) await reviewMembership(membership.id, "APPROVED");
  revalidatePath("/", "layout");
  return { success: true, slug };
}

export async function joinClubWithSession(token: string): Promise<Result & { slug?: string }> {
  const user = await verifySession();
  const invite = await findFixedClubInvite(token);
  if (!user || !invite || invite.club_status !== "ACTIVE") return { success: false, error: "Invalid invitation" };
  await requestMembership(invite.club_id, user.id);
  return { success: true, slug: invite.club_slug };
}

export async function requestToJoinClub(slug: string): Promise<Result> {
  const user = await verifySession();
  const club = await findClubBySlug(slug);
  if (!user || user.role === "GUEST" || !club || club.status !== "ACTIVE") return { success: false, error: "Unauthorized" };
  await requestMembership(club.id, user.id);
  revalidatePath("/es/clubs");
  revalidatePath("/en/clubs");
  return { success: true };
}

export async function joinClubAsGuest(input: { token: string; username: string; password: string }): Promise<Result & { slug?: string }> {
  const invite = await findFixedClubInvite(input.token);
  const username = input.username.trim().toLowerCase().replace(/\s+/g, "");
  if (!invite || invite.club_status !== "ACTIVE") return { success: false, error: "Invalid invitation" };
  if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username) || input.password.length < 8) return { success: false, error: "Use a name of 3–32 characters and a password of at least 8 characters" };
  if (await usernameExists(username)) return { success: false, error: "That name is already in use" };
  const user = await createUserRecord({ username, password: await bcrypt.hash(input.password, 10), role: "GUEST", name: username });
  await requestMembership(invite.club_id, user.id);
  const token = jwt.sign({ id: user.id, username: user.username, isAdmin: false, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "180d", algorithm: "HS256" });
  const cookieStore = await cookies();
  cookieStore.set("yomimono_key", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 180 * 24 * 60 * 60 });
  return { success: true, slug: invite.club_slug };
}

export async function reviewClubMember(slug: string, memberId: string, status: "APPROVED" | "REJECTED" | "REVOKED"): Promise<Result> {
  const context = await manager(slug);
  if (!context) return { success: false, error: "Unauthorized" };
  const member = await queryOne<{ id: string; user_id: string; role: string }>(`SELECT m.id,m.user_id,u.role
    FROM reading_club_members m
    INNER JOIN users u ON u.id=m.user_id
    WHERE m.id=$1 AND m.club_id=$2`, [memberId, context.club.id]);
  if (!member) return { success: false, error: "Member not found" };
  if (status === "APPROVED" && !(await canUserAccessClubReading(member.user_id, context.club.id))) {
    return { success: false, error: "This user cannot access the club's current reading" };
  }
  await reviewMembership(memberId, status);
  if (member.role === "GUEST") await deleteGuestWithoutActiveClubs(member.user_id);
  revalidatePath(`/es/clubs/${slug}`);
  revalidatePath(`/en/clubs/${slug}`);
  return { success: true };
}

export async function removeClubMember(slug: string, memberId: string): Promise<Result> {
  const context = await manager(slug);
  if (!context) return { success: false, error: "Unauthorized" };
  const member = await queryOne<{ user_id: string; role: string }>("SELECT m.user_id,u.role FROM reading_club_members m INNER JOIN users u ON u.id=m.user_id WHERE m.id=$1 AND m.club_id=$2", [memberId, context.club.id]);
  if (!member || member.user_id === context.club.ownerId) return { success: false, error: "Unauthorized" };
  await reviewMembership(memberId, "REVOKED");
  if (member.role === "GUEST") await deleteGuestWithoutActiveClubs(member.user_id);
  revalidatePath(`/es/clubs/${slug}`);
  revalidatePath(`/en/clubs/${slug}`);
  return { success: true };
}

export async function addClubMember(slug: string, userId: string): Promise<Result> {
  const context = await manager(slug);
  if (!context || context.club.status !== "ACTIVE" || !userId) return { success: false, error: "Unauthorized" };
  const user = await queryOne<{ id: string }>("SELECT id FROM users WHERE id=$1 AND disabled_at IS NULL", [userId]);
  if (!user) return { success: false, error: "User not found" };
  if (!(await canUserAccessClubReading(user.id, context.club.id))) {
    return { success: false, error: "This user cannot access the club's current reading" };
  }
  await addApprovedMembership(context.club.id, user.id);
  revalidatePath(`/es/clubs/${slug}`);
  revalidatePath(`/en/clubs/${slug}`);
  return { success: true };
}

export async function createClubCycle(slug: string, input: { title: string; voteClosesAt?: string }): Promise<Result & { cycleId?: string }> {
  const context = await manager(slug);
  const title = input.title.trim();
  if (!context || context.club.status !== "ACTIVE" || !title) return { success: false, error: "Invalid cycle" };
  const pendingCycle = await queryOne<{ id: string }>("SELECT id FROM reading_club_cycles WHERE club_id=$1 AND status IN ('DRAFT','VOTING') LIMIT 1", [context.club.id]);
  if (pendingCycle) return { success: false, error: "A cycle is already being prepared" };
  const date = input.voteClosesAt ? new Date(`${input.voteClosesAt}T23:59:59.999`) : null;
  if (date && (Number.isNaN(date.getTime()) || date <= new Date())) return { success: false, error: "Choose a future voting deadline" };
  const cycle = await createCycleRecord(context.club.id, title, date);
  return { success: true, cycleId: cycle.id };
}

export async function confirmClubCandidates(slug: string, cycleId: string, candidates: Array<{ sourceType: ClubSourceType; sourceId: string }>): Promise<Result> {
  const context = await manager(slug);
  const uniqueCandidates = Array.from(new Map(candidates.filter((candidate) => candidate.sourceId && (candidate.sourceType === "LIBRARY_SERIES" || candidate.sourceType === "BOOK_SERIES")).map((candidate) => [`${candidate.sourceType}:${candidate.sourceId}`, candidate])).values());
  if (!context || context.club.status !== "ACTIVE" || !(await belongsToClub(cycleId, context.club.id)) || !uniqueCandidates.length) return { success: false, error: "Choose at least one work" };
  const cycle = await queryOne<{ status: string; vote_closes_at: Date | null }>("SELECT status,vote_closes_at FROM reading_club_cycles WHERE id=$1", [cycleId]);
  if (!cycle || cycle.status !== "DRAFT") return { success: false, error: "This cycle cannot be changed" };
  if (!(await Promise.all(uniqueCandidates.map((candidate) => canClubMembersAccessWork(context.club.id, candidate.sourceType, candidate.sourceId)))).every(Boolean)) {
    return { success: false, error: "The selected work is restricted for a club participant" };
  }
  if (uniqueCandidates.length === 1) {
    await execute("UPDATE reading_club_cycles SET status='COMPLETED', completed_at=NOW(), updated_at=NOW() WHERE club_id=$1 AND status='READING' AND id<>$2", [context.club.id, cycleId]);
    await selectCycleWork(cycleId, uniqueCandidates[0].sourceType, uniqueCandidates[0].sourceId);
  } else {
    if (!cycle.vote_closes_at || cycle.vote_closes_at <= new Date()) return { success: false, error: "Choose a future voting deadline" };
    await replaceCycleCandidates(cycleId, uniqueCandidates);
    await execute("UPDATE reading_club_cycles SET status='VOTING', updated_at=NOW() WHERE id=$1", [cycleId]);
  }
  revalidatePath(`/es/clubs/${slug}`);
  revalidatePath(`/en/clubs/${slug}`);
  return { success: true };
}

export async function removeClubCandidate(slug: string, cycleId: string, candidateId: string): Promise<Result> {
  const context = await manager(slug);
  if (!context || context.club.status !== "ACTIVE" || !(await belongsToClub(cycleId, context.club.id))) return { success: false, error: "Unauthorized" };
  const cycle = await queryOne<{ status: string }>("SELECT status FROM reading_club_cycles WHERE id=$1", [cycleId]);
  if (!cycle || cycle.status !== "VOTING") return { success: false, error: "Candidates can only be removed from an open vote" };
  await removeCandidateRecord(candidateId, cycleId);
  const remaining = await queryOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM reading_club_candidates WHERE cycle_id=$1", [cycleId]);
  if (Number(remaining?.count ?? 0) < 2) {
    await replaceCycleCandidates(cycleId, []);
    await execute("UPDATE reading_club_cycles SET status='DRAFT', updated_at=NOW() WHERE id=$1", [cycleId]);
  }
  revalidatePath(`/es/clubs/${slug}`);
  revalidatePath(`/en/clubs/${slug}`);
  return { success: true };
}

export async function addClubCandidate(slug: string, cycleId: string, sourceType: ClubSourceType, sourceId: string): Promise<Result> {
  const context = await manager(slug);
  if (!context || context.club.status !== "ACTIVE" || !sourceId || !(await belongsToClub(cycleId, context.club.id))) return { success: false, error: "Unauthorized" };
  const cycle = await queryOne<{ status: string; vote_closes_at: Date | null }>("SELECT status,vote_closes_at FROM reading_club_cycles WHERE id=$1", [cycleId]);
  if (cycle?.status !== "VOTING" || (cycle.vote_closes_at && cycle.vote_closes_at <= new Date())) return { success: false, error: "Candidates can only be added to an open vote" };
  if (!(await canClubMembersAccessWork(context.club.id, sourceType, sourceId))) {
    return { success: false, error: "The selected work is restricted for a club participant" };
  }
  await addCandidateRecord(cycleId, sourceType, sourceId);
  return { success: true };
}

export async function selectClubWork(slug: string, cycleId: string, sourceType: ClubSourceType, sourceId: string): Promise<Result> {
  const context = await manager(slug);
  if (!context || context.club.status !== "ACTIVE" || !sourceId || !(await belongsToClub(cycleId, context.club.id))) return { success: false, error: "Unauthorized" };
  const cycle = await queryOne<{ status: string; vote_closes_at: Date | null }>("SELECT status,vote_closes_at FROM reading_club_cycles WHERE id=$1", [cycleId]);
  if (!cycle || (cycle.status === "VOTING" && (!cycle.vote_closes_at || cycle.vote_closes_at > new Date()))) return { success: false, error: "Voting must be closed before choosing a work" };
  if (!(await canClubMembersAccessWork(context.club.id, sourceType, sourceId))) {
    return { success: false, error: "The selected work is restricted for a club participant" };
  }
  if (cycle.status === "VOTING") {
    const candidate = await queryOne<{ id: string }>("SELECT id FROM reading_club_candidates WHERE cycle_id=$1 AND source_type=$2 AND source_id=$3", [cycleId, sourceType, sourceId]);
    if (!candidate) return { success: false, error: "Choose one of the voting candidates" };
  }
  await execute("UPDATE reading_club_cycles SET status='COMPLETED', completed_at=NOW(), updated_at=NOW() WHERE club_id=$1 AND status='READING' AND id<>$2", [context.club.id, cycleId]);
  await selectCycleWork(cycleId, sourceType, sourceId);
  revalidatePath(`/es/clubs/${slug}`);
  revalidatePath(`/en/clubs/${slug}`);
  return { success: true };
}

export async function addClubMilestone(slug: string, cycleId: string, input: { label: string; position: number; targetDate: string }): Promise<Result> {
  const context = await manager(slug);
  if (!context || context.club.status !== "ACTIVE" || !(await belongsToClub(cycleId, context.club.id)) || !input.label.trim() || input.position < 1 || input.position > 100) return { success: false, error: "Invalid milestone" };
  await addMilestoneRecord(cycleId, input.position, input.label.trim(), input.targetDate);
  return { success: true };
}

export async function completeClubCycle(slug: string, cycleId: string): Promise<Result> {
  const context = await manager(slug);
  if (!context || context.club.status !== "ACTIVE" || !(await belongsToClub(cycleId, context.club.id))) return { success: false, error: "Unauthorized" };
  await execute("UPDATE reading_club_cycles SET status='COMPLETED', completed_at=NOW(), updated_at=NOW() WHERE id=$1 AND status='READING'", [cycleId]);
  revalidatePath(`/es/clubs/${slug}`);
  revalidatePath(`/en/clubs/${slug}`);
  return { success: true };
}

export async function voteForClubCandidate(slug: string, cycleId: string, candidateId: string): Promise<Result> {
  const user = await verifySession();
  const club = await findClubBySlug(slug);
  if (!user || !club || !(await canAccessClub(club, user.id, user.isAdmin))) return { success: false, error: "Unauthorized" };
  const member = await getMembership(club.id, user.id);
  if (!member || member.status !== "APPROVED") return { success: false, error: "Membership pending" };
  const cycle = await queryOne<{ status: string; vote_closes_at: Date | null; club_id: string }>("SELECT status,vote_closes_at,club_id FROM reading_club_cycles WHERE id=$1", [cycleId]);
  if (!cycle || cycle.club_id !== club.id || cycle.status !== "VOTING" || (cycle.vote_closes_at && cycle.vote_closes_at <= new Date())) return { success: false, error: "Voting is closed" };
  await castVoteRecord(cycleId, candidateId, member.id);
  return { success: true };
}

export async function archiveClub(slug: string): Promise<Result> {
  const context = await manager(slug);
  if (!context) return { success: false, error: "Unauthorized" };
  await archiveClubRecord(context.club.id);
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteClub(slug: string): Promise<Result> {
  const context = await manager(slug);
  if (!context) return { success: false, error: "Unauthorized" };
  await deleteClubRecord(context.club.id);
  revalidatePath("/", "layout");
  return { success: true };
}
