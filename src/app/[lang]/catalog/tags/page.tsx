import { getDictionary } from "@/lib/i18n/Dictionary";
import { BookCopyIcon } from "lucide-react";
import type { Locale } from "@/lib/types";

interface CatalogTagsPageProps {
  params: Promise<{ lang: string }>;
}

export default async function CatalogTagsPage({
  params,
}: CatalogTagsPageProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);

  return (
    <h2 className="flex items-center mb-4">
      <BookCopyIcon size={28} className="mr-2" />
      {intl.catalog.tags as string}
    </h2>
  );
}
