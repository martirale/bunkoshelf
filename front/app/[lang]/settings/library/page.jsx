import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function SettingsLibraryPage({ params }) {
  const { lang } = params;
  const intl = await getDictionary(lang);

  return (
    <div className="p-4">
      <h2>{intl.settings.library}</h2>
    </div>
  );
}
