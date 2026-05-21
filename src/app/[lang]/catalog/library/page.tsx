import { Suspense } from "react";
import { LibraryBigIcon } from "lucide-react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { listPagedCatalogLibraryVolumes } from "@/lib/db/library";
import { verifySession } from "@/lib/auth/verifySession";
import CatalogLibraryTable from "@/components/catalog/CatalogLibraryTable";
import type { Locale } from "@/lib/types";

interface CatalogLibraryPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
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
  const page = Number.parseInt(pageRaw, 10) || 1;
  const intl = await getDictionary(lang as Locale);
  const user = await verifySession();
  const volumes = await listPagedCatalogLibraryVolumes({
    page,
    pageSize: 50,
    userId: user?.id ?? null,
  });

  return (
    <>
      <h2 className="flex items-center mb-4">
        <LibraryBigIcon size={28} className="mr-2" />
        {intl.catalog.library as string}
      </h2>

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
