import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function SettingsPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="p-4">
      <h2>{intl.settings.title}</h2>
    </div>
  );
}
