import { getDictionary } from "@/lib/i18n/Dictionary";
import { verifySession } from "@/lib/auth/verifySession";
import ProfileForm from "@/components/profile/ProfileForm";
import { UserRoundPenIcon } from "lucide-react";
import type { Locale, DictionarySection } from "@/lib/types";

interface UpdateProfilePageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function UpdateProfilePage({
  params,
}: UpdateProfilePageProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  const user = await verifySession();

  const profile = intl.profile as DictionarySection;

  return (
    <>
      <h2 className="flex items-center mb-4">
        <UserRoundPenIcon size={28} className="mr-2" />
        {profile.updateProfile as string}
      </h2>

      <ProfileForm user={user} intl={intl} />
    </>
  );
}
