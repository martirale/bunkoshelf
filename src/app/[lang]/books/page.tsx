import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";
import BookOverview from "@/components/library/books/BookOverview";

function OverviewSkeleton() {
  return <div className="p-4"><div className="h-7 w-48 animate-pulse rounded bg-sand" /></div>;
}

async function BooksPageContent({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const intl = await getDictionary(lang as Locale);
  return <main><BookOverview lang={lang} intl={intl} /></main>;
}

export default function BooksPage(props: { params: Promise<{ lang: string }> }) {
  return <Suspense fallback={<OverviewSkeleton />}><BooksPageContent {...props} /></Suspense>;
}
