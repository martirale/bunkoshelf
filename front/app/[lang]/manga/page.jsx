import LibraryRow from "@/ui/library/LibraryRow";
import LibraryRowHero from "@/ui/library/LibraryRowHero";
import { getDictionary } from "@/lib/i18n/serverDictionary";
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
      {/* KEEP READING */}
      <section className="w-full p-4 bg-lilah">
        <LibraryRowHero
          intl={intl}
          title={intl.libraries.keepReading}
          icon={<LibraryBig />}
        />
      </section>

      {/* IN PROGRESS */}
      <section className="p-4">
        <LibraryRow
          intl={intl}
          title={intl.libraries.inProgress}
          icon={<BookMarked />}
          className="mt-8"
        />
      </section>

      {/* RECENTLY ADDED */}
      <section className="p-4">
        <LibraryRow
          intl={intl}
          title={intl.libraries.recentlyAdded}
          icon={<BookPlus />}
          className="mt-8"
        />
      </section>

      {/* RECENTLY UPDATED SERIES */}
      <section className="p-4">
        <LibraryRow
          intl={intl}
          title={intl.libraries.recentlyUpdated}
          icon={<BookDown />}
          className="mt-8"
        />
      </section>

      {/* RECENTLY READ */}
      <section className="p-4">
        <LibraryRow
          intl={intl}
          title={intl.libraries.recentlyRead}
          icon={<BookCheck />}
          className="mt-8"
        />
      </section>
    </>
  );
}
