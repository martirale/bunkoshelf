import { getDictionary } from "@/lib/i18n/serverDictionary";
import MangaNav from "@/ui/library/manga/MangaNav";
import { LibraryBig } from "lucide-react";
import LibraryRowHero from "@/components/library/manga/row/LibraryRowHero";
import LibraryGridSeries from "@/components/library/manga/grid/LibraryGridSeries";

export default async function MangaSeriesPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      {/* Keep Reading */}
      <section className="w-full p-4 bg-lilah">
        <LibraryRowHero
          lang={lang}
          intl={intl}
          title={intl.libraries.keepReading}
          icon={<LibraryBig />}
        />
      </section>

      <MangaNav lang={lang} intl={intl} />

      {/* All Series */}
      <section className="p-4 mb-16">
        <LibraryGridSeries
          lang={lang}
          intl={intl}
          title={intl.manga.allSeries}
          icon={<LibraryBig />}
          className="mt-8"
        />
      </section>
    </>
  );
}
