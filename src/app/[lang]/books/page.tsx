import { getDictionary } from "@/lib/i18n/Dictionary";
import { ConstructionIcon } from "lucide-react";
import type { Locale } from "@/lib/types";

interface BooksPageProps {
  params: Promise<{ lang: string }>;
}

export default async function BooksPage({ params }: BooksPageProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
      <ConstructionIcon size={64} />
      <h2 className="font-roboto text-center">{intl.misc.coming as string}</h2>
    </div>
  );
}
