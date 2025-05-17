import { getDictionary } from "@/lib/i18n/serverDictionary";
import LibraryGridVolumes from "@/components/library/manga/grid/LibraryGridVolumes";

export default async function MangaVolumesPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <section className="p-4 mb-16">
      <LibraryGridVolumes lang={lang} intl={intl} />
    </section>
  );
}
