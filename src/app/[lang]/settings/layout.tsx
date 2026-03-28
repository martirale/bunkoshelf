import { getDictionary } from "@/lib/i18n/Dictionary";
import SidebarMisc from "@/components/ui/SidebarMisc";
import SettingsNav from "@/components/settings/SettingsNav";
import { Settings2Icon } from "lucide-react";
import type { Locale, Dictionary } from "@/lib/types";

interface SettingsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function SettingsLayout({
  children,
  params,
}: SettingsLayoutProps) {
  const { lang = "es" } = await params;
  const intl: Dictionary = await getDictionary(lang as Locale);

  return (
    <div className="flex flex-col md:flex-row md:h-screen overflow-hidden">
      <SidebarMisc>
        <h2 className="flex items-center text-onix">
          <Settings2Icon size={28} className="mr-2" />
          {intl.settings.title as string}
        </h2>

        <SettingsNav intl={intl} />
      </SidebarMisc>

      <div className="w-full md:w-[60%] lg:w-[68%] xl:w-[73%] 2xl:w-[80%] p-4 overflow-y-auto">
        <div className="mb-24 md:mb-4">{children}</div>
      </div>
    </div>
  );
}
