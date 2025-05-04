import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function HomePage({ params }) {
  const { lang } = params;
  const intl = await getDictionary(lang);

  return <></>;
}
