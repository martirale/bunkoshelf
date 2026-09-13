import { Suspense } from "react";
import { notFound } from "next/navigation";
import { findBookVolumeBySlug } from "@/lib/db/books/library";
import { verifySession } from "@/lib/auth/verifySession";
import { findBookProgress, listBookReadingEntries } from "@/lib/db/books/reading";
import BookVolumeContent from "@/components/library/books/BookVolumeContent";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

function DetailSkeleton() {
  return <div className="p-4"><div className="h-[32rem] animate-pulse rounded-lg bg-sand md:w-5/12" /></div>;
}

async function BookVolumePageContent({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const user = await verifySession();
  const volume = await findBookVolumeBySlug(slug);
  if (!volume || volume.series.librarySection !== "books") notFound();
  const intl = await getDictionary(lang as Locale);
  const [readingEntries, progress]: [Awaited<ReturnType<typeof listBookReadingEntries>>, Awaited<ReturnType<typeof findBookProgress>>] = user
    ? await Promise.all([
      listBookReadingEntries(user.id, volume.id),
      findBookProgress(user.id, volume.id),
    ])
    : [[], null];
  return <BookVolumeContent volume={volume} lang={lang as Locale} intl={intl} readingEntries={readingEntries} personalRating={progress?.personalRating ?? null} isAdmin={user?.isAdmin === true} />;
}

export default function BookVolumePage(props: { params: Promise<{ lang: string; slug: string }> }) {
  return <Suspense fallback={<DetailSkeleton />}><BookVolumePageContent {...props} /></Suspense>;
}
