import { getDictionary } from "@/lib/i18n/Dictionary";
import WantToRead from "@/components/library/manga/grid/WantToRead";

export default async function ToReadPage({
  searchParams: _searchParams,
  params,
}) {
  const searchParams = await _searchParams;
  const { page: pageRaw = "1", genre, tag } = searchParams;
  const page = parseInt(pageRaw, 10);

  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <section className="p-4 mt-4 mb-24 md:mb-4">
      <WantToRead
        lang={lang}
        intl={intl}
        page={page}
        genreFilter={genre}
        tagFilter={tag}
      />
    </section>
  );
}
