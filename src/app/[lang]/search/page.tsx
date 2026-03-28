import SearchComp from "@/components/search/SearchComp";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

interface SearchPageProps {
  params: Promise<{ lang: string }>;
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);

  return (
    <div className="p-4">
      <SearchComp lang={lang as Locale} intl={intl} />
    </div>
  );
}
