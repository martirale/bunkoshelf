import LibraryRowHero from "@/ui/library/manga/LibraryRowHero";
import { getDictionary } from "@/lib/i18n/serverDictionary";
import MangaNav from "@/components/library/manga/MangaNav";
import { LibraryBig } from "lucide-react";
import LibraryGridVolumes from "@/ui/library/manga/LibraryGridVolumes";

export default async function MangaVolumesPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      {/* KEEP READING */}
      <section className="w-full p-4 bg-lilah">
        <LibraryRowHero
          lang={lang}
          intl={intl}
          title={intl.libraries.keepReading}
          icon={<LibraryBig />}
        />
      </section>

      <MangaNav lang={lang} intl={intl} />

      {/* IN PROGRESS */}
      <section className="p-4">
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
