import { redirect } from "next/navigation";
import ClubList from "@/components/clubs/ClubList";
import { verifySession } from "@/lib/auth/verifySession";
import { listClubsForUser } from "@/lib/db/clubs";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

export default async function ClubsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const user = await verifySession();
  if (!user) redirect(`/${lang}/login`);
  const [clubs, intl] = await Promise.all([listClubsForUser(user.id, { includePublic: user.role !== "GUEST" }), getDictionary(lang as Locale)]);
  return <ClubList clubs={clubs} lang={lang} canCreate={user.role !== "GUEST"} isAdmin={user.isAdmin} intl={intl} />;
}
