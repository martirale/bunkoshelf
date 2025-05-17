import { getDictionary } from "@/lib/i18n/serverDictionary";
import { verifySession } from "@/lib/auth/verifySession";
import ProfileForm from "@/components/profile/ProfileForm";
import { UserRoundPen } from "lucide-react";

export default async function UpdateProfilePage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  const user = await verifySession();

  return (
    <>
      <h2 className="flex items-center mb-4">
        <UserRoundPen className="w-7 h-7 mr-2" />
        {intl.profile.updateProfile}
      </h2>

      <ProfileForm user={user} intl={intl} />
    </>
  );
}
