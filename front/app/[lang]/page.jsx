import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function Home({ params }) {
  const { lang } = params;
  const dict = await getDictionary(lang);

  return (
    <>
      <h2>{dict.home.hero}</h2>
    </>
  );
}
