import { getDictionary } from "@/lib/i18n/Dictionary";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/verifySession";
import { UsersRound } from "lucide-react";
import UsersTable from "@/components/settings/UsersTable";
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
    <>
      <div className="flex items-center justify-between mb-8">
        <h2 className="flex items-center">
          <UsersRound className="w-7 h-7 mr-2" />
          {intl.settings.users}
        </h2>

        <AddUserButton intl={intl} />
      </div>

      <UsersTable users={users} currentUserId={currentUser?.id} intl={intl} />
    </>
  );
}
