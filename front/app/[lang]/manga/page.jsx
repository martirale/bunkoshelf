import LibraryRowNewVol from "@/components/library/manga/row/LibraryRowNewVol";
import LibraryRowNext from "@/components/library/manga/row/LibraryRowNext";
import LibraryRowRecently from "@/components/library/manga/row/LibraryRowRecently";
import { getDictionary } from "@/lib/i18n/Dictionary";

export default async function MangaPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="p-4 mb-24">
      {/* Next Reading */}
      <LibraryRowNext lang={lang} intl={intl} />

      {/* Recently Added */}
      <LibraryRowNewVol lang={lang} intl={intl} />

      {/* Recently Read */}
      <LibraryRowRecently lang={lang} intl={intl} />
    </div>
  );
}
