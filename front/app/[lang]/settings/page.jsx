import { getDictionary } from "@/lib/i18n/Dictionary";
import { Bolt } from "lucide-react";
import { getBuildInfo } from "@/lib/utils";
import Link from "next/link";
import AdminStatsPanel from "@/components/stats/AdminPanel";

export default async function SettingsPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);
  const { version, versionUrl, buildDate } = getBuildInfo();

  return (
    <>
      <h2 className="flex items-center mb-8">
        <Bolt className="w-7 h-7 mr-2" />
        {intl.settings.overview}
      </h2>

      <AdminStatsPanel intl={intl} />

      <h3 className="text-base mb-2">{intl.settings.infoServerTt}</h3>
      <p>{intl.settings.infoServerDesc}</p>

      <div className="flex items-center mt-4 gap-8">
        <div>
          <p className="font-bold">{intl.settings.semVer}</p>
          <Link href={versionUrl} target="_blank" className="hover:underline">
            v{version}
          </Link>
        </div>

        <p>
          <span className="font-bold">{intl.settings.buildDate}</span>
          <br />
          {buildDate}
        </p>
      </div>
    </>
  );
}
