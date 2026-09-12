import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import BookHero from "@/components/library/books/BookHero";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

async function BooksLayoutContent({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  await connection();
  const { lang } = await params;
  const intl = await getDictionary(lang as Locale);
  return <>
    <Suspense fallback={null}>
      <BookHero lang={lang as Locale} intl={intl} />
    </Suspense>
    <div className="mb-24 md:mb-4">{children}</div>
  </>;
}

export default function BooksLayout(props: { children: ReactNode; params: Promise<{ lang: string }> }) {
  return <Suspense fallback={null}><BooksLayoutContent {...props} /></Suspense>;
}
