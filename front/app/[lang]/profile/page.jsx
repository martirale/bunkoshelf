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

      <div className="my-4">
        <h3>
          Hola, {user.name}{" "}
          <span
            className={`inline-block px-2 py-1 text-white ${
              user.isAdmin ? "bg-red-500" : "bg-gray-500"
            } rounded`}
          >
            {user.isAdmin ? "Admin" : "Estándar"}
          </span>
        </h3>
      </div>

      <ProfileForm lang={lang} intl={intl} user={user} />
    </div>
  );
}
