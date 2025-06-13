import { getDictionary } from "@/lib/i18n/Dictionary";
import { FolderCog } from "lucide-react";
import LibSettingsButtons from "@/components/settings/LibSettingsButtons";

export default async function SettingsLibraryPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      <h2 className="flex items-center mb-8">
        <FolderCog className="w-7 h-7 mr-2" />
        {intl.settings.library}
      </h2>

      <LibSettingsButtons lang={lang} intl={intl} />
    </>
  );
}
