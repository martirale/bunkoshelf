import { getDictionary } from "@/lib/i18n/serverDictionary";
import { verifySession } from "@/lib/auth/verifySession";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  const user = await verifySession();

  return (
    <div className="p-4">
      <h2>
        {intl.profile.greeting} {user.name}!
      </h2>

      <ProfileForm user={user} lang={lang} intl={intl} />
    </div>
  );
}
