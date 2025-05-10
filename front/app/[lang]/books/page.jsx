import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function BooksPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      <section className="w-full p-4 bg-ash">
        <div className="pb-4">
          <h2 className="text-sand">{intl.libraries.keepReading}</h2>
        </div>
      </section>

      {/* IN PROGRESS */}
      <section className="p-4">
        <div className="pb-4">
          <h2>{intl.libraries.inProgress}</h2>
        </div>
      </section>

      {/* RECENTLY ADDED */}
      <section className="p-4">
        <div className="pb-4">
          <h2>{intl.libraries.recentlyAdded}</h2>
        </div>
      </section>

      {/* RECENTLY UPDATED SERIES */}
      <section className="p-4">
        <div className="pb-4">
          <h2>{intl.libraries.recentlyUpdated}</h2>
        </div>
      </section>

      {/* RECENTLY READ */}
      <section className="p-4">
        <div className="pb-4">
          <h2>{intl.libraries.recentlyRead}</h2>
        </div>
      </section>
    </>
  );
}
