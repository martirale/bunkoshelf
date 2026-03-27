import { getDictionary } from "@/lib/i18n/Dictionary";
import WantToRead from "@/components/library/manga/grid/WantToRead";
import type { Locale } from "@/lib/types";

interface ToReadPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
  params: Promise<{ lang: string }>;
}

export default async function ToReadPage({
  searchParams: _searchParams,
  params,
}: ToReadPageProps) {
  const searchParams = await _searchParams;
  const { page: pageRaw = "1", genre, tag } = searchParams;
  const page = parseInt(pageRaw ?? "1", 10);

  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);

  return (
    <section className="p-4 mt-4">
      <WantToRead
        lang={lang as Locale}
        intl={intl}
        page={page}
        genreFilter={genre}
        tagFilter={tag}
      />
    </section>
  );
}
