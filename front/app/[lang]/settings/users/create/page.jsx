import { getDictionary } from "@/lib/i18n/serverDictionary";
import SidebarMisc from "@/ui/SidebarMisc";
import SettingsNav from "@/components/settings/SettingsNav";
import CreateUserForm from "./CreateUserForm";
import { Settings2, UserRoundPlus } from "lucide-react";

export default async function SettingsUsersCreatePage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="flex">
      <SidebarMisc>
        <h2 className="flex items-center text-onix">
          <Settings2 className="w-7 h-7 mr-2" />
          {intl.settings.title}
        </h2>

        <SettingsNav intl={intl} />
      </SidebarMisc>

      <div className="w-full md:w-8/12 2xl:w-9/12 p-4">
        <h2 className="flex items-center mb-4">
          <UserRoundPlus className="w-6 h-6 mr-2" />
          {intl.settings.createUser}
        </h2>
        <CreateUserForm intl={intl} />
      </div>
    </div>
  );
}
