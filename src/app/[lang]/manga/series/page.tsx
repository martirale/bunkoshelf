import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import SeriesIndex from "@/components/library/manga/grid/SeriesIndex";
import { getLibraryScope } from "@/lib/librarySection";
import type { Locale } from "@/lib/types";

interface MangaSeriesPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
  params: Promise<{ lang: string }>;
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 2xl:grid-cols-7 gap-4 mt-4">
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/5] rounded-lg bg-sand animate-pulse"
        />
      ))}
    </div>
  );
}

async function SeriesIndexContent({
  searchParams,
  params,
}: MangaSeriesPageProps) {
  const resolvedSearchParams = await searchParams;
  const { page: pageRaw = "1", author, genre, tag } = resolvedSearchParams;
  const page = parseInt(pageRaw ?? "1", 10);
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);
  const scope = getLibraryScope("manga");

  return (
    <SeriesIndex
      lang={lang as Locale}
      intl={intl}
      page={page}
      authorFilter={author}
      genreFilter={genre}
      tagFilter={tag}
      scope={scope}
    />
  );
}

export default function MangaSeriesPage({
  searchParams,
  params,
}: MangaSeriesPageProps) {
  return (
    <section className="p-4 mt-4">
      <Suspense fallback={<GridSkeleton />}>
        <SeriesIndexContent searchParams={searchParams} params={params} />
      </Suspense>
    </section>
  );
}
