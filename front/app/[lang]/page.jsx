import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function Home({ params }) {
  const { lang } = params;
  const intl = await getDictionary(lang);

  return (
    <>
      <h2>{intl.home.hero}</h2>
    </>
  );
}
