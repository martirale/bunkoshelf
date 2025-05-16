import LibraryRow from "@/components/library/manga/row/LibraryRow";
import LibraryRowHero from "@/components/library/manga/row/LibraryRowHero";
import LibraryRowNewVol from "@/components/library/manga/row/LibraryRowNewVol";
import { getDictionary } from "@/lib/i18n/serverDictionary";
import MangaNav from "@/ui/library/manga/MangaNav";
import {
  LibraryBig,
  BookMarked,
  BookPlus,
  BookDown,
  BookCheck,
} from "lucide-react";

export default async function MangaPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      {/* Keep Reading */}
      <section className="w-full p-4 bg-lilah">
        <LibraryRowHero
          lang={lang}
          intl={intl}
          title={intl.libraries.keepReading}
          icon={<LibraryBig />}
        />
      </section>

      <MangaNav lang={lang} intl={intl} />

      <div className="p-4 mb-16">
        {/* In Progress */}
        {/* <section>
          <LibraryRow
            lang={lang}
            intl={intl}
            title={intl.libraries.inProgress}
            icon={<BookMarked />}
            className="mt-8"
          />
        </section> */}

        {/* Recently Added */}
        <section>
          <LibraryRowNewVol
            lang={lang}
            intl={intl}
            title={intl.libraries.recentlyAdded}
            icon={<BookPlus />}
            className="mt-8"
          />
        </section>

        {/* Updated Series */}
        {/* <section>
          <LibraryRow
            lang={lang}
            intl={intl}
            title={intl.libraries.recentlyUpdated}
            icon={<BookDown />}
            className="mt-8"
          />
        </section> */}

        {/* Recently Read */}
        {/* <section>
          <LibraryRow
            lang={lang}
            intl={intl}
            title={intl.libraries.recentlyRead}
            icon={<BookCheck />}
            className="mt-8"
          />
        </section> */}
      </div>
    </>
  );
}
