import { Suspense } from "react";
import NextVol from "@/components/library/manga/row/NextVol";
import NewVols from "@/components/library/manga/row/NewVols";
import DemographicsTiles from "@/components/library/manga/Demographics";
import RecentlyRead from "@/components/library/manga/row/RecentlyRead";
import { isOthersLibraryEnabled } from "@/lib/db/appSettings";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { getLibraryScope } from "@/lib/librarySection";
import type { Locale } from "@/lib/types";

interface MangaPageProps {
  params: Promise<{ lang: string }>;
}

function MangaRowSkeleton() {
  return (
    <section className="mt-8">
      <div className="h-7 w-48 rounded bg-sand animate-pulse mb-4" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-1/2 md:w-1/5 2xl:w-1/7 aspect-[3/5] rounded-lg bg-sand animate-pulse" />
        ))}
      </div>
    </section>
  );
}

async function MangaPageContent({ params }: MangaPageProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);
  const othersLibraryEnabled = await isOthersLibraryEnabled();
  const scope = getLibraryScope("manga", othersLibraryEnabled);

  return (
    <div className="p-4">
      <Suspense fallback={<MangaRowSkeleton />}>
        <NextVol lang={lang as Locale} intl={intl} scope={scope} />
      </Suspense>

      <DemographicsTiles intl={intl} lang={lang as Locale} />

      <Suspense fallback={<MangaRowSkeleton />}>
        <NewVols lang={lang as Locale} intl={intl} scope={scope} />
      </Suspense>

      <Suspense fallback={<MangaRowSkeleton />}>
        <RecentlyRead lang={lang as Locale} intl={intl} scope={scope} />
      </Suspense>
    </div>
  );
}

export default function MangaPage(props: MangaPageProps) {
  return (
    <Suspense fallback={<MangaRowSkeleton />}>
      <MangaPageContent {...props} />
    </Suspense>
  );
}
