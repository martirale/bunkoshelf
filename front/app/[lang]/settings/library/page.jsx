import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function SettingsLibraryPage({ params }) {
  const { lang } = params;
  const intl = await getDictionary(lang);

  return (
    <div className="p-4">
      <h2>{intl.sidebar.settings}</h2>
    </div>
  );
}
