import { notFound, redirect } from "next/navigation";
import ClubReader from "@/components/clubs/ClubReader";
import { verifySession } from "@/lib/auth/verifySession";
import { canAccessClub, findClubBySlug, getClubDashboard, listSelectedCycleVolumes } from "@/lib/db/clubs";
import { findVolumeBySlug } from "@/lib/db/library";
import { findBookVolumeBySlug } from "@/lib/db/books/library";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

export default async function ClubReaderPage({ params }: { params: Promise<{ lang: string; slug: string; kind: string; volume: string }> }) {
  const { lang, slug, kind, volume: volumeSlug } = await params;
  if (kind !== "manga" && kind !== "books") notFound();
  const user = await verifySession();
  if (!user) redirect(`/${lang}/login`);
  const club = await findClubBySlug(slug);
  if (!club || !(await canAccessClub(club, user.id, user.isAdmin))) notFound();
  const dashboard = await getClubDashboard(club, user.id);
  const active = dashboard.cycles.find((cycle) => cycle.status === "READING");
  const allowed = await listSelectedCycleVolumes(active ?? null);
  if (!allowed.some((item) => item.slug === volumeSlug && item.kind === kind)) notFound();
  const intl = await getDictionary(lang as Locale);
  if (kind === "manga") {
    const item = await findVolumeBySlug({ slug: volumeSlug });
    if (!item) notFound();
    return <ClubReader kind="manga" volume={{ id: item.id, slug: item.slug, title: item.title, mangaStyle: item.metadataObj?.mangaStyle }} returnHref={`/${lang}/clubs/${slug}`} intl={intl} />;
  }
  const item = await findBookVolumeBySlug(volumeSlug);
  if (!item) notFound();
  return <ClubReader kind="books" volume={{ id: item.id, slug: item.slug, title: item.title, layout: item.metadata.renditionLayout }} returnHref={`/${lang}/clubs/${slug}`} intl={intl} />;
}
