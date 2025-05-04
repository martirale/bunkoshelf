import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function MangaPage({ params }) {
  const { lang } = params;
  const intl = await getDictionary(lang);

  return (
    <section className="w-full p-4 bg-lilah">
      <div className="pb-4">
        <h2 className="text-sand">{intl.hero.keepreading}</h2>
      </div>
    </section>
  );
}
