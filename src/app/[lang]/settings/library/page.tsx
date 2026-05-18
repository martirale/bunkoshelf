import { getDictionary } from "@/lib/i18n/Dictionary";
import { FolderCogIcon } from "lucide-react";
import LibSettingsButtons from "@/components/settings/LibSettingsButtons";
import LibraryModeTile from "@/components/settings/LibraryModeTile";
import Separator from "@/components/ui/Separator";
import { getAppSettings } from "@/lib/db/appSettings";
import type { Locale, Dictionary } from "@/lib/types";

interface SettingsLibraryPageProps {
  params: Promise<{ lang: string }>;
}

export default async function SettingsLibraryPage({
  params,
}: SettingsLibraryPageProps) {
  const { lang = "es" } = await params;
  const intl: Dictionary = await getDictionary(lang as Locale);
  const libProvider = process.env.LIB_PROVIDER;
  const settings = await getAppSettings();

  return (
    <>
      <h2 className="flex items-center mb-4">
        <FolderCogIcon size={28} className="mr-2" />
        {intl.settings.library as string}
      </h2>

      <div className="mb-4">
        <LibraryModeTile
          intl={intl}
          initialEnabled={settings.othersLibraryEnabled}
        />
      </div>

      <Separator />
      <LibSettingsButtons lang={lang as Locale} intl={intl} libProvider={libProvider} />
    </>
  );
}
