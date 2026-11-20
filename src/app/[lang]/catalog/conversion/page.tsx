import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ArrowLeftRightIcon } from "lucide-react";
import CatalogLibraryTable from "@/components/catalog/CatalogLibraryTable";
import { verifySession } from "@/lib/auth/verifySession";
import { listPagedCatalogLibraryVolumes } from "@/lib/db/library";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

interface CatalogConversionPageProps {
  params: Promise<{ lang: Locale }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

async function ConversionContent({ params, searchParams }: CatalogConversionPageProps) {
  const { lang = "es" } = await params;
  const [user, intl, query] = await Promise.all([verifySession(), getDictionary(lang), searchParams]);
  if (!user) return null;
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const data = await listPagedCatalogLibraryVolumes({ userId: user.id, page, pageSize: 50, conversion: true });

  if (page > 1 && page > data.totalPages) redirect(`/${lang}/catalog/conversion?page=${Math.max(1, data.totalPages)}`);

  return (
    <>
      <h2 className="mb-4 flex items-center">
        <ArrowLeftRightIcon size={28} className="mr-2" />
        {intl.catalog.conversion as string}
      </h2>
      <CatalogLibraryTable data={data} lang={lang} intl={intl} canManage={user.isAdmin === true} conversion />
    </>
  );
}

export default function CatalogConversionPage(props: CatalogConversionPageProps) {
  return (
    <Suspense fallback={<div className="h-80 animate-pulse rounded-lg bg-sand" aria-busy="true" />}>
      <ConversionContent {...props} />
    </Suspense>
  );
}
