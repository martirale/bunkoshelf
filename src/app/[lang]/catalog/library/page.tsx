import { parseCatalogFilters } from "@/lib/catalogFilters";
import CatalogLibraryFilters from "@/components/catalog/CatalogLibraryFilters";
import { Suspense } from "react";
import { LibraryBigIcon } from "lucide-react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { listPagedCatalogLibraryVolumes, listCatalogLibraryFilterOptions } from "@/lib/db/library";
import { verifySession } from "@/lib/auth/verifySession";
import CatalogLibraryTable from "@/components/catalog/CatalogLibraryTable";
import CatalogLibraryUpload from "@/components/catalog/CatalogLibraryUpload";
import CreateLogicalSeries from "@/components/catalog/CreateLogicalSeries";
import { listLogicalSeriesOptions } from "@/lib/db/logicalSeries";
import type { Locale } from "@/lib/types";

interface CatalogLibraryPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function CatalogLibrarySkeleton() {
  return (
    <>
      <div className="h-8 w-48 rounded bg-sand animate-pulse mb-4" />
      <div className="h-80 rounded-lg bg-sand animate-pulse" />
    </>
  );
}

async function CatalogLibraryPageContent({
  params,
  searchParams,
}: CatalogLibraryPageProps) {
  const { lang = "es" } = await params;
  const resolvedSearchParams = await searchParams;
  const pageRaw = resolvedSearchParams.page ?? "1";
  const page = Number.parseInt(Array.isArray(pageRaw) ? pageRaw[0] : pageRaw, 10) || 1;
  const intl = await getDictionary(lang as Locale);
  const user = await verifySession();
  const [volumes, filterOptions] = await Promise.all([
    listPagedCatalogLibraryVolumes({
      page,
      pageSize: 50,
      userId: user?.id ?? null,
      filters: parseCatalogFilters(resolvedSearchParams),
    }),
    listCatalogLibraryFilterOptions(),
  ]);
  const seriesOptions = user?.isAdmin ? await listLogicalSeriesOptions() : [];

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="flex items-center">
          <LibraryBigIcon size={28} className="mr-2" />
          {intl.catalog.library as string}
        </h2>
        <div className="flex flex-wrap justify-end gap-2">
          <CatalogLibraryFilters intl={intl} options={filterOptions} />
          {user?.isAdmin === true && (
            <>
              <CreateLogicalSeries intl={intl} options={seriesOptions} />
              <CatalogLibraryUpload intl={intl} lang={lang as Locale} />
            </>
          )}
        </div>
      </div>

      <CatalogLibraryTable
        data={volumes}
        intl={intl}
        canManage={user?.isAdmin === true}
        lang={lang as Locale}
      />
    </>
  );
}

export default function CatalogLibraryPage(props: CatalogLibraryPageProps) {
  return (
    <Suspense fallback={<CatalogLibrarySkeleton />}>
      <CatalogLibraryPageContent {...props} />
    </Suspense>
  );
}
