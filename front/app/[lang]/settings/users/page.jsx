import { getDictionary } from "@/lib/i18n/serverDictionary";
import SidebarMisc from "@/ui/SidebarMisc";
import SettingsNav from "@/components/settings/SettingsNav";
import prisma from "@/lib/prisma";
import { Settings2, UsersRound } from "lucide-react";
import UsersTable from "@/components/settings/UsersTable";
import { verifySession } from "@/lib/auth/verifySession";
import AddUserButton from "@/components/settings/AddUserButton";

export default async function SettingsUsersPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  const currentUser = await verifySession();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      isAdmin: true,
      name: true,
      lastname: true,
      birthYear: true,
    },
    orderBy: {
      name: "asc",
    },
  });

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center">
            <UsersRound className="w-7 h-7 mr-2" />
            {intl.settings.users}
          </h2>

          <AddUserButton intl={intl} />
        </div>

        <UsersTable users={users} currentUserId={currentUser?.id} intl={intl} />
      </div>
    </div>
  );
}
