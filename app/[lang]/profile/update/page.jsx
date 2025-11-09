import { getDictionary } from "@/lib/i18n/Dictionary";
import { verifySession } from "@/lib/auth/verifySession";
import ProfileForm from "@/components/profile/ProfileForm";
import { UserRoundPenIcon } from "lucide-react";

export default async function UpdateProfilePage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  const user = await verifySession();

  return (
    <>
      <h2 className="flex items-center mb-4">
        <UserRoundPenIcon size={28} className="mr-2" />
        {intl.profile.updateProfile}
      </h2>

      <ProfileForm user={user} intl={intl} />
    </>
  );
}
