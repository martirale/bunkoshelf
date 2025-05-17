import { getDictionary } from "@/lib/i18n/serverDictionary";
import { LibraryBig } from "lucide-react";
import LibraryGridVolumes from "@/components/library/manga/grid/LibraryGridVolumes";

export default async function MangaVolumesPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <section className="p-4 mb-16">
      <LibraryGridVolumes
        lang={lang}
        intl={intl}
        title={intl.manga.allVolumes}
        icon={<LibraryBig />}
        className="mt-8"
      />
    </section>
  );
}
