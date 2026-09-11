import { Suspense } from "react";
import NextVol from "@/components/library/manga/row/NextVol";
import NewVols from "@/components/library/manga/row/NewVols";
import RecentlyRead from "@/components/library/manga/row/RecentlyRead";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

async function Content({ params }: { params: Promise<{ lang: string }> }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);

  return (
    <div className="library-overview p-4">
      <div className="library-overview-section">
        <NextVol lang={lang as Locale} intl={intl} scope="comic" section="comic" />
      </div>

      <div className="library-overview-section">
        <NewVols lang={lang as Locale} intl={intl} scope="comic" section="comic" />
      </div>

      <div className="library-overview-section">
        <RecentlyRead lang={lang as Locale} intl={intl} scope="comic" section="comic" />
      </div>
    </div>
  );
}
export default function ComicPage(props: { params: Promise<{ lang: string }> }) { return <Suspense fallback={null}><Content {...props} /></Suspense>; }
