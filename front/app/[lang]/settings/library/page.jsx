import { getDictionary } from "@/lib/i18n/serverDictionary";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import { redirect } from "next/navigation";

export default async function SettingsLibraryPage({ params }) {
  const { lang } = params;
  const { isAdmin } = await checkAdminAccess();
  if (!isAdmin) {
    redirect(`/${lang}`);
  }
  const intl = await getDictionary(lang);

  return (
    <div className="p-4">
      <h2>{intl.settings.library}</h2>
    </div>
  );
}
