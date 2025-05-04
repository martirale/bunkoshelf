import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function HomePage({ params }) {
  const { lang } = params;
  const intl = await getDictionary(lang);

  return (
    <section className="w-full p-4 bg-pearl">
      <div className="pb-4">
        <h2 className="text-onix">{intl.hero.keepreading}</h2>
      </div>
    </section>
  );
}
