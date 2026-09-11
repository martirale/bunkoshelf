import VolumesIndex from "@/components/library/books/grid/VolumesIndex";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

export default async function BookVolumesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const intl = await getDictionary(lang as Locale);
  return <section className="p-4"><VolumesIndex lang={lang as Locale} intl={intl} /></section>;
}
