import WantToRead from "@/components/library/books/grid/WantToRead";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

export default async function BooksToReadPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const intl = await getDictionary(lang as Locale);
  return <section className="p-4"><WantToRead lang={lang as Locale} intl={intl} /></section>;
}
