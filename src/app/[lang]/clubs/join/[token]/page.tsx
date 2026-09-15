import { notFound } from "next/navigation";
import ClubInvite from "@/components/clubs/ClubInvite";
import { verifySession } from "@/lib/auth/verifySession";
import { findInviteByTokenHash } from "@/lib/db/clubs";
import { createHash } from "node:crypto";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

export default async function ClubInvitePage({ params }: { params: Promise<{ lang: string; token: string }> }) {
  const { lang, token } = await params;
  const invite = await findInviteByTokenHash(createHash("sha256").update(token).digest("hex"));
  if (!invite || invite.club_status !== "ACTIVE") notFound();
  const [user, intl] = await Promise.all([verifySession(), getDictionary(lang as Locale)]);
  return <ClubInvite token={token} clubName={invite.club_name} lang={lang} signedIn={!!user} intl={intl} />;
}
