import SearchComp from "@/components/search/SearchComp";
import { getDictionary } from "@/lib/i18n/Dictionary";

export default async function SearchPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="p-4">
      <SearchComp lang={lang} intl={intl} />
    </div>
  );
}
