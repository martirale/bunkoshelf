import { getDictionary } from "@/lib/i18n/serverDictionary";
import SidebarMisc from "@/ui/SidebarMisc";

export default async function SettingsLibraryPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="flex">
      <SidebarMisc>
        <h2 className="text-onix">{intl.settings.library}</h2>
      </SidebarMisc>

      <div className="w-full md:w-8/12 2xl:w-9/12 p-4"></div>
    </div>
  );
}
