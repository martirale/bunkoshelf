import { getDictionary } from "@/lib/i18n/serverDictionary";
import MangaNav from "@/ui/library/manga/MangaNav";
import { LibraryBig } from "lucide-react";
import LibraryRowHero from "@/components/library/manga/row/LibraryRowHero";
import LibraryGridVolumes from "@/components/library/manga/grid/LibraryGridVolumes";

export default async function MangaVolumesPage({ params }) {
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

      {/* All Volumes */}
      <section className="p-4 mb-16">
        <LibraryGridVolumes
          lang={lang}
          intl={intl}
          title={intl.manga.allVolumes}
          icon={<LibraryBig />}
          className="mt-8"
        />
      </section>
    </>
  );
}
