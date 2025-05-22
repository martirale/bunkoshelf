import { getDictionary } from "@/lib/i18n/Dictionary";
import LibraryGridSeries from "@/components/library/manga/grid/LibraryGridSeries";

export default async function MangaSeriesPage({ searchParams, params }) {
  const page = parseInt(searchParams.page || "1", 10);
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <section className="p-4 mb-16">
      <LibraryGridSeries lang={lang} intl={intl} page={page} />
    </section>
  );
}
