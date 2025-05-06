import { getDictionary } from "@/lib/i18n/serverDictionary";
import ProfileForm from "./UserForm";
import { cookies } from "next/headers";

export default async function ProfilePage({ params }) {
  const { lang } = params;
  const intl = await getDictionary(lang);

  const res = await fetch("http://localhost:3001/api/users/me", {
    headers: {
      Cookie: (await cookies()).toString(),
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    return <div>Error cargando perfil</div>;
  }

  const user = await res.json();

  return (
    <div className="p-4">
      <h2>{intl.profile.title}</h2>
      <ProfileForm lang={lang} intl={intl} user={user} />
    </div>
  );
}
