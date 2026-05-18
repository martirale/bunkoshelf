import { Suspense } from "react";
import { connection } from "next/server";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { FolderCogIcon } from "lucide-react";
import LibSettingsButtons from "@/components/settings/LibSettingsButtons";
import LibraryModeTile from "@/components/settings/LibraryModeTile";
import Separator from "@/components/ui/Separator";
import { getAppSettingsLive } from "@/lib/db/appSettings";
import type { Locale, Dictionary } from "@/lib/types";

interface SettingsLibraryPageProps {
  params: Promise<{ lang: string }>;
}

function SettingsLibrarySkeleton() {
  return (
    <>
      <div className="h-8 w-48 rounded bg-sand animate-pulse mb-4" />
      <div className="h-32 rounded-lg bg-sand animate-pulse mb-4" />
      <div className="h-px bg-sand mb-4" />
      <div className="h-40 rounded-lg bg-sand animate-pulse" />
    </>
  );
}

async function SettingsLibraryPageContent({
  params,
}: SettingsLibraryPageProps) {
  await connection();

  const { lang = "es" } = await params;
  const intl: Dictionary = await getDictionary(lang as Locale);
  const libProvider = process.env.LIB_PROVIDER;
  const settings = await getAppSettingsLive();

  return (
    <>
      <h2 className="flex items-center mb-4">
        <FolderCogIcon size={28} className="mr-2" />
        {intl.settings.library as string}
      </h2>

      <div className="mb-4">
        <LibraryModeTile
          intl={intl}
          initialEnabled={settings.othersLibraryEnabled}
        />
      </div>

      <Separator />
      <LibSettingsButtons lang={lang as Locale} intl={intl} libProvider={libProvider} />
    </>
  );
}

export default function SettingsLibraryPage(params: SettingsLibraryPageProps) {
  return (
    <Suspense fallback={<SettingsLibrarySkeleton />}>
      <SettingsLibraryPageContent {...params} />
    </Suspense>
  );
}
