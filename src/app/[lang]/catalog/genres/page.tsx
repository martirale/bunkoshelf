import { Suspense } from "react";
import { DramaIcon } from "lucide-react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { listPagedCatalogGenres } from "@/lib/db/library";
import CatalogRelationsTable from "@/components/catalog/CatalogRelationsTable";
import type { Locale } from "@/lib/types";

interface CatalogGenresPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

function CatalogGenresSkeleton() {
  return (
    <>
      <div className="h-8 w-48 rounded bg-sand animate-pulse mb-4" />
      <div className="h-80 rounded-lg bg-sand animate-pulse" />
    </>
  );
}

async function CatalogGenresPageContent({
  params,
  searchParams,
}: CatalogGenresPageProps) {
  const { lang = "es" } = await params;
  const resolvedSearchParams = await searchParams;
  const pageRaw = resolvedSearchParams.page ?? "1";
  const page = Number.parseInt(pageRaw, 10) || 1;
  const intl = await getDictionary(lang as Locale);
  const genres = await listPagedCatalogGenres({
    page,
    pageSize: 50,
  });

  return (
    <>
      <h2 className="flex items-center mb-4">
        <DramaIcon size={28} className="mr-2" />
        {intl.catalog.genres as string}
      </h2>

      <CatalogRelationsTable
        data={genres}
        intl={intl}
        nameLabel={intl.catalog.genreColumn as string}
      />
    </>
  );
}

export default function CatalogGenresPage(props: CatalogGenresPageProps) {
  return (
    <Suspense fallback={<CatalogGenresSkeleton />}>
      <CatalogGenresPageContent {...props} />
    </Suspense>
  );
}
