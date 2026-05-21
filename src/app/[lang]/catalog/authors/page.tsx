import { Suspense } from "react";
import { UserRoundPenIcon } from "lucide-react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { verifySession } from "@/lib/auth/verifySession";
import { listPagedCatalogAuthors } from "@/lib/db/library";
import CatalogAuthorsTable from "@/components/catalog/CatalogAuthorsTable";
import type { Locale } from "@/lib/types";

interface CatalogAuthorsPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

function CatalogAuthorsSkeleton() {
  return (
    <>
      <div className="h-8 w-48 rounded bg-sand animate-pulse mb-4" />
      <div className="h-80 rounded-lg bg-sand animate-pulse" />
    </>
  );
}

async function CatalogAuthorsPageContent({
  params,
  searchParams,
}: CatalogAuthorsPageProps) {
  const { lang = "es" } = await params;
  const resolvedSearchParams = await searchParams;
  const pageRaw = resolvedSearchParams.page ?? "1";
  const page = Number.parseInt(pageRaw, 10) || 1;
  const intl = await getDictionary(lang as Locale);
  const user = await verifySession();
  const authors = await listPagedCatalogAuthors({
    page,
    pageSize: 50,
    userId: user?.id ?? null,
  });

  return (
    <>
      <h2 className="flex items-center mb-4">
        <UserRoundPenIcon size={28} className="mr-2" />
        {intl.catalog.authors as string}
      </h2>

      <CatalogAuthorsTable data={authors} intl={intl} />
    </>
  );
}

export default function CatalogAuthorsPage(props: CatalogAuthorsPageProps) {
  return (
    <Suspense fallback={<CatalogAuthorsSkeleton />}>
      <CatalogAuthorsPageContent {...props} />
    </Suspense>
  );
}
