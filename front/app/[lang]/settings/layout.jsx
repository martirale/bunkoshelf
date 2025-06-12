import { getDictionary } from "@/lib/i18n/Dictionary";
import SidebarMisc from "@/components/ui/SidebarMisc";
import SettingsNav from "@/components/settings/SettingsNav";
import { Settings2 } from "lucide-react";

export default async function SettingsLayout({ children, params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="flex flex-col md:flex-row md:h-screen overflow-hidden">
      <SidebarMisc>
        <h2 className="flex items-center text-onix">
          <Settings2 className="w-7 h-7 mr-2" />
          {intl.settings.title}
        </h2>

        <SettingsNav intl={intl} />
      </SidebarMisc>

      <div className="w-full md:w-8/12 2xl:w-9/12 p-4 overflow-y-auto">
        <div className="mb-24">{children}</div>
      </div>
    </div>
  );
}
