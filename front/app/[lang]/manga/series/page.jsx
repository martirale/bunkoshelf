import { getDictionary } from "@/lib/i18n/serverDictionary";
import LibraryGridSeries from "@/components/library/manga/grid/LibraryGridSeries";

export default async function MangaSeriesPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <section className="p-4 mb-16">
      <LibraryGridSeries lang={lang} intl={intl} />
    </section>
  );
}
