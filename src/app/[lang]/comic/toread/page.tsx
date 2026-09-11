import { Suspense } from "react";
import WantToRead from "@/components/library/manga/grid/WantToRead";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

interface ComicToReadPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
  params: Promise<{ lang: string }>;
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-5 2xl:grid-cols-7 gap-4 mt-4">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="aspect-[3/5] rounded-lg bg-sand animate-pulse" />
      ))}
    </div>
  );
}

async function WantToReadContent({
  searchParams,
  params,
}: ComicToReadPageProps) {
  const resolvedSearchParams = await searchParams;
  const { page: pageRaw = "1", author, genre, tag } = resolvedSearchParams;
  const page = parseInt(pageRaw ?? "1", 10);
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);

  return (
    <WantToRead
      lang={lang as Locale}
      intl={intl}
      page={page}
      authorFilter={author}
      genreFilter={genre}
      tagFilter={tag}
      scope="comic"
      section="comic"
    />
  );
}

export default function ComicToReadPage({
  searchParams,
  params,
}: ComicToReadPageProps) {
  return (
    <section className="p-4">
      <Suspense fallback={<GridSkeleton />}>
        <WantToReadContent searchParams={searchParams} params={params} />
      </Suspense>
    </section>
  );
}
