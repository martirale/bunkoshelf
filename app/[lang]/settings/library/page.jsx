import { getDictionary } from "@/lib/i18n/Dictionary";
import { FolderCogIcon } from "lucide-react";
import LibSettingsButtons from "@/components/settings/LibSettingsButtons";

export default async function SettingsLibraryPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      <h2 className="flex items-center mb-4">
        <FolderCogIcon size={28} className="mr-2" />
        {intl.settings.library}
      </h2>

      <LibSettingsButtons lang={lang} intl={intl} />
    </>
  );
}
