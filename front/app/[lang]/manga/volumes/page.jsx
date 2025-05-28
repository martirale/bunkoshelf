import { getDictionary } from "@/lib/i18n/Dictionary";
import LibraryGridVolumes from "@/components/library/manga/grid/LibraryGridVolumes";

export default async function MangaVolumesPage({
  searchParams: _searchParams,
  params,
}) {
  const searchParams = await _searchParams;
  const { page: pageRaw = "1" } = searchParams;
  const page = parseInt(pageRaw, 10);

  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <section className="p-4 mb-24">
      <LibraryGridVolumes lang={lang} intl={intl} page={page} />
    </section>
  );
}
