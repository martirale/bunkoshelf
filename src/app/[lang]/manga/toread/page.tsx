import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import WantToRead from "@/components/library/manga/grid/WantToRead";
import { getLibraryScope } from "@/lib/librarySection";
import type { Locale } from "@/lib/types";

interface ToReadPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
  params: Promise<{ lang: string }>;
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 2xl:grid-cols-7 gap-4 mt-4">
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/5] rounded-lg bg-sand animate-pulse"
        />
      ))}
    </div>
  );
}

async function WantToReadContent({ searchParams, params }: ToReadPageProps) {
  const resolvedSearchParams = await searchParams;
  const { page: pageRaw = "1", author, genre, tag } = resolvedSearchParams;
  const page = parseInt(pageRaw ?? "1", 10);
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);
  const scope = getLibraryScope("manga");

  return (
    <WantToRead
      lang={lang as Locale}
      intl={intl}
      page={page}
      authorFilter={author}
      genreFilter={genre}
      tagFilter={tag}
      scope={scope}
    />
  );
}

export default function ToReadPage({ searchParams, params }: ToReadPageProps) {
  return (
    <section className="p-4 mt-4">
      <Suspense fallback={<GridSkeleton />}>
        <WantToReadContent searchParams={searchParams} params={params} />
      </Suspense>
    </section>
  );
}
