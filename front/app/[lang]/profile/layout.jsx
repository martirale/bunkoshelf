import { getDictionary } from "@/lib/i18n/Dictionary";
import { verifySession } from "@/lib/auth/verifySession";
import SidebarMisc from "@/components/ui/SidebarMisc";
import ProfileNav from "@/components/profile/ProfileNav";
import { UserRound } from "lucide-react";

export default async function ProfilePage({ children, params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  const user = await verifySession();

  return (
    <div className="flex flex-col md:flex-row">
      <SidebarMisc>
        {!user || !user.name ? (
          <h2 className="flex items-center text-onix">
            <UserRound className="w-7 h-7 mr-2" />
            {intl.profile.title}
          </h2>
        ) : (
          <h2 className="flex items-center text-onix">
            <UserRound className="w-7 h-7 mr-2" />
            {intl.profile.greeting} {user.name}
          </h2>
        )}

        <ProfileNav intl={intl} />
      </SidebarMisc>

      <div className="w-full md:w-8/12 2xl:w-9/12 p-4 mb-24">{children}</div>
    </div>
  );
}
