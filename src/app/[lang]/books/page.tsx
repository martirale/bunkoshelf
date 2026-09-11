import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";
import BookOverview from "@/components/library/books/BookOverview";

export default async function BooksPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const intl = await getDictionary(lang as Locale);
  return <main><BookOverview lang={lang} intl={intl} /></main>;
}
