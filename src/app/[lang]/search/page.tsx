import SearchComp from "@/components/search/SearchComp";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

interface SearchPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="p-4">
      <SearchComp lang={lang} intl={intl} />
    </div>
  );
}
