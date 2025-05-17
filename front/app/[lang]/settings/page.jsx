import { getDictionary } from "@/lib/i18n/serverDictionary";
import { Bolt } from "lucide-react";

export default async function SettingsPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      <h2 className="flex items-center mb-4">
        <Bolt className="w-7 h-7 mr-2" />
        {intl.settings.overview}
      </h2>
    </>
  );
}
