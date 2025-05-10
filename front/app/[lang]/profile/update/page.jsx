import { getDictionary } from "@/lib/i18n/serverDictionary";
import { verifySession } from "@/lib/auth/verifySession";
import ProfileForm from "@/components/profile/ProfileForm";
import SidebarMisc from "@/ui/SidebarMisc";
import ProfileNav from "@/components/profile/ProfileNav";
import { UserRound, UserRoundPen } from "lucide-react";

export default async function UpdateProfilePage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  const user = await verifySession();

  return (
    <div className="flex">
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

      <div className="w-full md:w-8/12 2xl:w-9/12 p-4">
        <h2 className="flex items-center mb-4">
          <UserRoundPen className="w-7 h-7 mr-2" />
          {intl.profile.updateProfile}
        </h2>

        <ProfileForm user={user} intl={intl} />
      </div>
    </div>
  );
}
