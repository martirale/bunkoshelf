import { getDictionary } from "@/lib/i18n/serverDictionary";
import SidebarMisc from "@/ui/SidebarMisc";
import SettingsNav from "@/components/settings/SettingsNav";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/verifySession";

export default async function SettingsUsersPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

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
        <h2 className="text-onix">{intl.settings.users}</h2>

        <SettingsNav intl={intl} />
      </SidebarMisc>

      <div className="w-full md:w-8/12 2xl:w-9/12 p-4">
        <div className="space-y-4">
          <table className="w-full text-left">
            <thead className="uppercase">
              <tr>
                <th className="p-2 border-b">Usuario</th>
                <th className="p-2 border-b">Tipo</th>
                <th className="p-2 border-b">Nombre</th>
                <th className="p-2 border-b">Apellido</th>
                <th className="p-2 border-b">Edad</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const currentYear = new Date().getFullYear();
                const age = user.birthYear ? currentYear - user.birthYear : "—";
                return (
                  <tr key={user.id} className="border-t">
                    <td className="p-2">{user.username}</td>
                    <td className="p-2">{user.isAdmin ? "Admin" : "User"}</td>
                    <td className="p-2">{user.name || "—"}</td>
                    <td className="p-2">{user.lastname || "—"}</td>
                    <td className="p-2">{age}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
