import { notFound } from "next/navigation";
import { findBookVolumeBySlug } from "@/lib/db/books/library";
import { verifySession } from "@/lib/auth/verifySession";
import BookVolumeContent from "@/components/library/books/BookVolumeContent";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

export default async function BookVolumePage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const volume = await findBookVolumeBySlug(slug);
  if (!volume) notFound();
  const intl = await getDictionary(lang as Locale);
  const user = await verifySession();
  return <BookVolumeContent volume={volume} lang={lang as Locale} intl={intl} isAdmin={user?.isAdmin === true} />;
}
