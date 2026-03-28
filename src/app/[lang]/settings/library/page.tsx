import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { FolderCogIcon } from "lucide-react";
import LibSettingsButtons from "@/components/settings/LibSettingsButtons";
import AdminStatsPanel from "@/components/stats/AdminPanel";
import Separator from "@/components/ui/Separator";
import type { Locale, Dictionary } from "@/lib/types";

interface SettingsLibraryPageProps {
  params: Promise<{ lang: string }>;
}

function AdminStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[110px] rounded-lg bg-blackamber animate-pulse" />
      ))}
    </div>
  );
}

export default async function SettingsLibraryPage({
  params,
}: SettingsLibraryPageProps) {
  const { lang = "es" } = await params;
  const intl: Dictionary = await getDictionary(lang as Locale);
  const libProvider = process.env.LIB_PROVIDER;

  return (
    <>
      <h2 className="flex items-center mb-4">
        <FolderCogIcon size={28} className="mr-2" />
        {intl.settings.library as string}
      </h2>

      <div className="mb-4">
        <Suspense fallback={<AdminStatsSkeleton />}>
          <AdminStatsPanel intl={intl} />
        </Suspense>
      </div>

      <Separator />
      <LibSettingsButtons lang={lang as Locale} intl={intl} libProvider={libProvider} />
    </>
  );
}
