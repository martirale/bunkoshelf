import { Suspense } from "react";
import NextVol from "@/components/library/manga/row/NextVol";
import NewVols from "@/components/library/manga/row/NewVols";
import RecentlyRead from "@/components/library/manga/row/RecentlyRead";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

interface OthersPageProps {
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

async function OthersPageContent({ params }: OthersPageProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);

  return (
    <div className="p-4">
      <Suspense fallback={<MangaRowSkeleton />}>
        <NextVol
          lang={lang as Locale}
          intl={intl}
          scope="others"
          section="others"
        />
      </Suspense>

      <Suspense fallback={<MangaRowSkeleton />}>
        <NewVols
          lang={lang as Locale}
          intl={intl}
          scope="others"
          section="others"
        />
      </Suspense>

      <Suspense fallback={<MangaRowSkeleton />}>
        <RecentlyRead
          lang={lang as Locale}
          intl={intl}
          scope="others"
          section="others"
        />
      </Suspense>
    </div>
  );
}

export default function OthersPage(props: OthersPageProps) {
  return (
    <Suspense fallback={<MangaRowSkeleton />}>
      <OthersPageContent {...props} />
    </Suspense>
  );
}
