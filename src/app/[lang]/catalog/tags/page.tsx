import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { listPagedCatalogTags } from "@/lib/db/library";
import CatalogRelationsTable from "@/components/catalog/CatalogRelationsTable";
import { BookCopyIcon } from "lucide-react";
import type { Locale } from "@/lib/types";

interface CatalogTagsPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

function CatalogTagsSkeleton() {
  return (
    <>
      <div className="h-8 w-48 rounded bg-sand animate-pulse mb-4" />
      <div className="h-80 rounded-lg bg-sand animate-pulse" />
    </>
  );
}

async function CatalogTagsPageContent({
  params,
  searchParams,
}: CatalogTagsPageProps) {
  const { lang = "es" } = await params;
  const resolvedSearchParams = await searchParams;
  const pageRaw = resolvedSearchParams.page ?? "1";
  const page = Number.parseInt(pageRaw, 10) || 1;
  const intl = await getDictionary(lang as Locale);
  const tags = await listPagedCatalogTags({
    page,
    pageSize: 50,
  });

  return (
    <>
      <h2 className="flex items-center mb-4">
        <BookCopyIcon size={28} className="mr-2" />
        {intl.catalog.tags as string}
      </h2>

      <CatalogRelationsTable
        data={tags}
        intl={intl}
        nameLabel={intl.catalog.tagColumn as string}
      />
    </>
  );
}

export default function CatalogTagsPage(props: CatalogTagsPageProps) {
  return (
    <Suspense fallback={<CatalogTagsSkeleton />}>
      <CatalogTagsPageContent {...props} />
    </Suspense>
  );
}
