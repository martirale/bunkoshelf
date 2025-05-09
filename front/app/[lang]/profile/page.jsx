import { getDictionary } from "@/lib/i18n/serverDictionary";
import { verifySession } from "@/lib/auth/verifySession";
import ProfileForm from "./ProfileForm";
import SidebarMisc from "@/ui/SidebarMisc";

export default async function ProfilePage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  const user = await verifySession();

  return (
    <div className="flex">
      <SidebarMisc>
        <h2 className="text-onix">
          {intl.profile.greeting} {user.name}!
        </h2>
      </SidebarMisc>

      <div className="w-full md:w-8/12 2xl:w-9/12 p-4">
        <h2 className="mb-8">{intl.profile.updateprofile}</h2>

        <ProfileForm user={user} lang={lang} intl={intl} />
      </div>
    </div>
  );
}
