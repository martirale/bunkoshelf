import SeriesIndex from "@/components/library/books/grid/SeriesIndex";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

export default async function BookSeriesIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const intl = await getDictionary(lang as Locale);
  return <main className="p-4"><SeriesIndex lang={lang as Locale} intl={intl} /></main>;
}
