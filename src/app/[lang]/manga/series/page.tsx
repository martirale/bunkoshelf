import { getDictionary } from "@/lib/i18n/Dictionary";
import SeriesIndex from "@/components/library/manga/grid/SeriesIndex";
import type { Locale } from "@/lib/types";

interface MangaSeriesPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
  params: Promise<{ lang: string }>;
}

export default async function MangaSeriesPage({
  searchParams: _searchParams,
  params,
}: MangaSeriesPageProps) {
  const searchParams = await _searchParams;
  const { page: pageRaw = "1", genre, tag } = searchParams;
  const page = parseInt(pageRaw ?? "1", 10);

  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);

  return (
    <section className="p-4 mt-4">
      <SeriesIndex
        lang={lang as Locale}
        intl={intl}
        page={page}
        genreFilter={genre}
        tagFilter={tag}
      />
    </section>
  );
}
