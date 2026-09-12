import { Suspense } from "react";
import WantToRead from "@/components/library/books/grid/WantToRead";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

function GridSkeleton() {
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-5 2xl:grid-cols-7">{Array.from({ length: 14 }).map((_, index) => <div key={index} className="aspect-[3/5] animate-pulse rounded-lg bg-sand" />)}</div>;
}

async function BooksToReadPageContent({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const intl = await getDictionary(lang as Locale);
  return <WantToRead lang={lang as Locale} intl={intl} />;
}

export default function BooksToReadPage(props: { params: Promise<{ lang: string }> }) {
  return <section className="p-4"><Suspense fallback={<GridSkeleton />}><BooksToReadPageContent {...props} /></Suspense></section>;
}
