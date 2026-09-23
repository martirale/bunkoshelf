import { notFound, redirect } from "next/navigation";
import ClubDashboard from "@/components/clubs/ClubDashboard";
import { verifySession } from "@/lib/auth/verifySession";
import { canAccessClub, canManageClub, findClubBySlug, getClubDashboard, getFixedClubInviteToken, listClubUsers, listClubWorks, listCycleCandidates, listCycleMilestones, listSelectedCycleVolumes } from "@/lib/db/clubs";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

export default async function ClubPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const user = await verifySession();
  if (!user) redirect(`/${lang}/login`);
  const club = await findClubBySlug(slug);
  if (!club) notFound();
  if (!(await canAccessClub(club, user.id, user.isAdmin))) redirect(`/${lang}/clubs`);
  const isOwner = club.ownerId === user.id;
  const [dashboard, isManager, intl] = await Promise.all([getClubDashboard(club, user.id), canManageClub(club, user.id, user.isAdmin), getDictionary(lang as Locale)]);
  const active = dashboard.cycles.find((cycle) => cycle.status === "READING");
  const voting = dashboard.cycles.find((cycle) => cycle.status === "VOTING");
  const [works, activeCandidates, milestones, readingVolumes, users] = await Promise.all([
    isManager ? listClubWorks() : Promise.resolve([]),
    voting ? listCycleCandidates(voting.id) : Promise.resolve([]),
    active ? listCycleMilestones(active.id) : Promise.resolve([]),
    listSelectedCycleVolumes(active ?? null),
    isManager ? listClubUsers() : Promise.resolve([]),
  ]);
  return <ClubDashboard club={club} cycles={dashboard.cycles} members={dashboard.members} activities={dashboard.activities} activeCandidates={activeCandidates} milestones={milestones} works={works} readingVolumes={readingVolumes} users={users} isManager={isManager} isOwner={isOwner} inviteToken={isManager ? getFixedClubInviteToken(club) : null} lang={lang} intl={intl} />;
}
