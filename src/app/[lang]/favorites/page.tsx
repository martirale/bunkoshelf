import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import SeriesIndexFav from "@/components/library/manga/grid/SeriesIndexFav";
import VolumesIndexFav from "@/components/library/manga/grid/VolumesIndexFav";
import Separator from "@/components/ui/Separator";
import { getLibraryScope } from "@/lib/librarySection";
import type { Locale } from "@/lib/types";

interface FavoritesPageProps {
  params: Promise<{ lang: string }>;
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

async function FavoritesSeries({ params }: { params: Promise<{ lang: string }> }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);
  const scope = getLibraryScope("manga");
  return <SeriesIndexFav lang={lang as Locale} intl={intl} scope={scope} />;
}

async function FavoritesVolumes({ params }: { params: Promise<{ lang: string }> }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);
  const scope = getLibraryScope("manga");
  return <VolumesIndexFav lang={lang as Locale} intl={intl} scope={scope} />;
}

export default function FavoritesPage({ params }: FavoritesPageProps) {
  return (
    <>
      <Suspense fallback={<GridSkeleton />}>
        <FavoritesSeries params={params} />
      </Suspense>
      <Separator />
      <Suspense fallback={<GridSkeleton />}>
        <FavoritesVolumes params={params} />
      </Suspense>
    </>
  );
}
