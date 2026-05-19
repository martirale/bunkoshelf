import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import SeriesIndexFav from "@/components/library/manga/grid/SeriesIndexFav";
import { getLibraryScope } from "@/lib/librarySection";
import type { Locale } from "@/lib/types";

interface FavoritesMangaPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

function GridSkeleton() {
  return (
    <section className="p-4">
      <div className="h-7 w-48 rounded bg-sand animate-pulse mb-4" />
      <div className="grid grid-cols-3 md:grid-cols-5 2xl:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="aspect-[3/5] rounded-lg bg-sand animate-pulse" />
        ))}
      </div>
    </section>
  );
}

async function FavoritesMangaContent({
  params,
  searchParams,
}: FavoritesMangaPageProps) {
  const { lang = "es" } = await params;
  const resolvedSearchParams = await searchParams;
  const pageRaw = resolvedSearchParams.page ?? "1";
  const page = Number.parseInt(pageRaw, 10) || 1;
  const intl = await getDictionary(lang as Locale);
  const scope = getLibraryScope("manga");

  return (
    <SeriesIndexFav
      lang={lang as Locale}
      intl={intl}
      page={page}
      scope={scope}
    />
  );
}

export default function FavoritesMangaPage(props: FavoritesMangaPageProps) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <FavoritesMangaContent {...props} />
    </Suspense>
  );
}
