import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function BooksPage({ params }) {
  const { lang } = params;
  const intl = await getDictionary(lang);

  return (
    <section className="w-full p-4 bg-ash">
      <div className="pb-4">
        <h2 className="text-sand">{intl.hero.keepreading}</h2>
      </div>
    </section>
  );
}
