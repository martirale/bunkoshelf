import { Suspense } from "react";
import { LibraryBigIcon } from "lucide-react";
import CatalogLibraryFilters from "@/components/catalog/CatalogLibraryFilters";
import CatalogLibraryTable from "@/components/catalog/CatalogLibraryTable";
import CatalogLibraryUpload from "@/components/catalog/CatalogLibraryUpload";
import CreateLogicalSeries from "@/components/catalog/CreateLogicalSeries";
import { verifySession } from "@/lib/auth/verifySession";
import { parseCatalogFilters, type CatalogFilters } from "@/lib/catalogFilters";
import { listPagedCatalogLibraryVolumes, listCatalogLibraryFilterOptions } from "@/lib/db/library";
import { listLogicalSeriesOptions } from "@/lib/db/logicalSeries";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Dictionary, Locale } from "@/lib/types";

interface CatalogLibraryPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function TableSkeleton() {
  return <div className="h-80 rounded-lg bg-sand animate-pulse" aria-busy="true" />;
}

function ControlsSkeleton() {
  return <div className="h-8 w-24 rounded bg-sand animate-pulse" aria-busy="true" />;
}

async function SeriesControl({ intl }: { intl: Dictionary }) {
  const options = await listLogicalSeriesOptions();
  return <CreateLogicalSeries intl={intl} options={options} />;
}

async function FiltersControl({ intl }: { intl: Dictionary }) {
  const options = await listCatalogLibraryFilterOptions();
  return <CatalogLibraryFilters intl={intl} options={options} />;
}

async function CatalogResults({ filters, page, userId, canManage, intl, lang }: {
  filters: CatalogFilters;
  page: number;
  userId: string | null;
  canManage: boolean;
  intl: Dictionary;
  lang: Locale;
}) {
  const data = await listPagedCatalogLibraryVolumes({ filters, page, pageSize: 50, userId });
  return <CatalogLibraryTable data={data} intl={intl} canManage={canManage} lang={lang} />;
}

async function CatalogLibraryPageContent({ params, searchParams }: CatalogLibraryPageProps) {
  const { lang = "es" } = await params;
  const locale = lang as Locale;
  const [query, intl, user] = await Promise.all([searchParams, getDictionary(locale), verifySession()]);
  const pageRaw = Array.isArray(query.page) ? query.page[0] : query.page;
  const page = Number.parseInt(pageRaw ?? "1", 10) || 1;
  const filters = parseCatalogFilters(query);
  const canManage = user?.isAdmin === true;

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="flex items-center">
          <LibraryBigIcon size={28} className="mr-2" />
          {intl.catalog.library as string}
        </h2>
        <div className="flex flex-wrap justify-end gap-2">
          <Suspense fallback={<ControlsSkeleton />}>
            <FiltersControl intl={intl} />
          </Suspense>
          {canManage && (
            <>
              <Suspense fallback={<ControlsSkeleton />}>
                <SeriesControl intl={intl} />
              </Suspense>
              <CatalogLibraryUpload intl={intl} lang={locale} />
            </>
          )}
        </div>
      </div>

      <Suspense key={JSON.stringify(filters)} fallback={<TableSkeleton />}>
        <CatalogResults
          filters={filters}
          page={page}
          userId={user?.id ?? null}
          canManage={canManage}
          intl={intl}
          lang={locale}
        />
      </Suspense>
    </>
  );
}

export default function CatalogLibraryPage(props: CatalogLibraryPageProps) {
  return (
    <Suspense fallback={
      <>
        <div className="h-8 w-48 rounded bg-sand animate-pulse mb-4" />
        <TableSkeleton />
      </>
    }>
      <CatalogLibraryPageContent {...props} />
    </Suspense>
  );
}
