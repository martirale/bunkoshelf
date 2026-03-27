import { getDictionary } from "@/lib/i18n/Dictionary";
import VolumesIndex from "@/components/library/manga/grid/VolumesIndex";
import type { Locale } from "@/lib/types";

interface MangaVolumesPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
  params: Promise<{ lang: string }>;
}

export default async function MangaVolumesPage({
  searchParams: _searchParams,
  params,
}: MangaVolumesPageProps) {
  const searchParams = await _searchParams;
  const { page: pageRaw = "1", genre, tag } = searchParams;
  const page = parseInt(pageRaw ?? "1", 10);

  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);

  return (
    <section className="p-4 mt-4">
      <VolumesIndex
        lang={lang as Locale}
        intl={intl}
        page={page}
        genreFilter={genre}
        tagFilter={tag}
      />
    </section>
  );
}
