import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import VolumesIndexFav from "@/components/library/manga/grid/VolumesIndexFav";
import type { Locale } from "@/lib/types";

interface FavoritesOthersVolumesPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

function GridSkeleton() {
  return (
    <section className="p-4">
      <div className="h-7 w-48 rounded bg-sand animate-pulse mb-4" />
      <div className="grid grid-cols-3 md:grid-cols-5 2xl:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="aspect-[3/5] rounded-lg bg-sand animate-pulse" />
        ))}
      </div>
    </section>
  );
}

async function FavoritesOthersVolumesContent({
  params,
  searchParams,
}: FavoritesOthersVolumesPageProps) {
  const { lang = "es" } = await params;
  const resolvedSearchParams = await searchParams;
  const pageRaw = resolvedSearchParams.page ?? "1";
  const page = Number.parseInt(pageRaw, 10) || 1;
  const intl = await getDictionary(lang as Locale);

  return (
    <VolumesIndexFav
      lang={lang as Locale}
      intl={intl}
      page={page}
      scope="others"
      section="others"
    />
  );
}

export default function FavoritesOthersVolumesPage(
  props: FavoritesOthersVolumesPageProps
) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <FavoritesOthersVolumesContent {...props} />
    </Suspense>
  );
}
