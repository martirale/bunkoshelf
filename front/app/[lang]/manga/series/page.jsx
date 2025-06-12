import { getDictionary } from "@/lib/i18n/Dictionary";
import SeriesIndex from "@/components/library/manga/grid/SeriesIndex";

export default async function MangaSeriesPage({
  searchParams: _searchParams,
  params,
}) {
  const searchParams = await _searchParams;
  const { page: pageRaw = "1", genre, tag } = searchParams;
  const page = parseInt(pageRaw, 10);

  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <section className="p-4 mt-4 mb-24 md:mb-4">
      <SeriesIndex
        lang={lang}
        intl={intl}
        page={page}
        genreFilter={genre}
        tagFilter={tag}
      />
    </section>
  );
}
