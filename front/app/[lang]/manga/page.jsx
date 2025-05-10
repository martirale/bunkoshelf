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
      <section className="w-full p-4 bg-lilah">
        <div className="pb-4">
          <h2 className="flex items-center mb-4 text-sand">
            <LibraryBig className="w-7 h-7 mr-2" />
            {intl.libraries.keepReading}
          </h2>
        </div>
      </section>

      {/* IN PROGRESS */}
      <section className="p-4">
        <div className="pb-4">
          <h2 className="flex items-center mb-4">
            <BookMarked className="w-7 h-7 mr-2" />
            {intl.libraries.inProgress}
          </h2>
        </div>
      </section>

      {/* RECENTLY ADDED */}
      <section className="p-4">
        <div className="pb-4">
          <h2 className="flex items-center mb-4">
            <BookPlus className="w-7 h-7 mr-2" />
            {intl.libraries.recentlyAdded}
          </h2>
        </div>
      </section>

      {/* RECENTLY UPDATED SERIES */}
      <section className="p-4">
        <div className="pb-4">
          <h2 className="flex items-center mb-4">
            <BookDown className="w-7 h-7 mr-2" />
            {intl.libraries.recentlyUpdated}
          </h2>
        </div>
      </section>

      {/* RECENTLY READ */}
      <section className="p-4">
        <div className="pb-4">
          <h2 className="flex items-center mb-4">
            <BookCheck className="w-7 h-7 mr-2" />
            {intl.libraries.recentlyRead}
          </h2>
        </div>
      </section>
    </>
  );
}
