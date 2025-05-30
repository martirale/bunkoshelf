import NewVols from "@/components/library/manga/row/NewVols";
import NextVol from "@/components/library/manga/row/NextVol";
import RecentlyRead from "@/components/library/manga/row/RecentlyRead";
import { getDictionary } from "@/lib/i18n/Dictionary";

export default async function MangaPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="p-4 mb-24">
      {/* Next Reading */}
      <NextVol lang={lang} intl={intl} />

      {/* Recently Added */}
      <NewVols lang={lang} intl={intl} />

      {/* Recently Read */}
      <RecentlyRead lang={lang} intl={intl} />
    </div>
  );
}
