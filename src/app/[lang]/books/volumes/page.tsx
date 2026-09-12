import { Suspense } from "react";
import VolumesIndex from "@/components/library/books/grid/VolumesIndex";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

function GridSkeleton() {
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-5 2xl:grid-cols-7">{Array.from({ length: 14 }).map((_, index) => <div key={index} className="aspect-[3/5] animate-pulse rounded-lg bg-sand" />)}</div>;
}

async function BookVolumesPageContent({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const intl = await getDictionary(lang as Locale);
  return <VolumesIndex lang={lang as Locale} intl={intl} />;
}

export default function BookVolumesPage(props: { params: Promise<{ lang: string }> }) {
  return <section className="p-4"><Suspense fallback={<GridSkeleton />}><BookVolumesPageContent {...props} /></Suspense></section>;
}
