import { getDictionary } from "@/lib/i18n/Dictionary";
import LibraryGridVolumes from "@/components/library/manga/grid/LibraryGridVolumes";

export default async function MangaVolumesPage({ searchParams, params }) {
  const page = parseInt(searchParams.page || "1", 10);
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <section className="p-4 mb-16">
      <LibraryGridVolumes lang={lang} intl={intl} page={page} />
    </section>
  );
}
