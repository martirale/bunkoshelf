import { getDictionary } from "@/lib/i18n/Dictionary";
import { FolderCogIcon } from "lucide-react";
import LibSettingsButtons from "@/components/settings/LibSettingsButtons";
import AdminStatsPanel from "@/components/stats/AdminPanel";
import Separator from "@/components/ui/Separator";
import type { Locale, Dictionary } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SettingsLibraryPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function SettingsLibraryPage({
  params,
}: SettingsLibraryPageProps) {
  const { lang = "es" } = await params;
  const intl: Dictionary = await getDictionary(lang);
  const libProvider = process.env.LIB_PROVIDER;

  return (
    <>
      <h2 className="flex items-center mb-4">
        <FolderCogIcon size={28} className="mr-2" />
        {intl.settings.library as string}
      </h2>

      <div className="mb-4">
        <AdminStatsPanel intl={intl} />
      </div>

      <Separator />
      <LibSettingsButtons lang={lang} intl={intl} libProvider={libProvider} />
    </>
  );
}
