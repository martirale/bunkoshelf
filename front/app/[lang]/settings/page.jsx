import React from "react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { Bolt } from "lucide-react";
import { getBuildInfo } from "@/lib/utils";
import Link from "next/link";
import AdminStatsPanel from "@/components/stats/AdminPanel";
import { FileClock } from "lucide-react";
import ClearLogsButton from "@/components/settings/ClearLogsButton";

async function fetchLogs() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/logs/get`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) return "No se pudieron cargar los logs.";
  const text = await res.text();
  return text;
}

export default async function SettingsPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);
  const { version, versionUrl, buildDate } = getBuildInfo();

  const logs = await fetchLogs();

  return (
    <>
      <h2 className="flex items-center mb-8">
        <Bolt className="w-7 h-7 mr-2" />
        {intl.settings.overview}
      </h2>

      <div className="flex flex-col 2xl:flex-row gap-4">
        <div className="2xl:flex-1/2">
          <div className="mb-12">
            <AdminStatsPanel intl={intl} />
          </div>

          <h3 className="text-base mb-2">{intl.settings.infoServerTt}</h3>
          <p>{intl.settings.infoServerDesc}</p>

          <div className="flex items-center mt-4 gap-8">
            <div>
              <p className="font-bold">{intl.settings.semVer}</p>
              <Link
                href={versionUrl}
                target="_blank"
                className="hover:underline"
              >
                v{version}
              </Link>
            </div>

            <p>
              <span className="font-bold">{intl.settings.buildDate}</span>
              <br />
              {buildDate}
            </p>
          </div>
        </div>

        <div className="bg-blackamber rounded-lg p-4 2xl:flex-1/2 mt-8 2xl:mt-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base">{intl.settings.ttActivity}</h2>
            <ClearLogsButton />
          </div>
          <div className="min-h-[300px] max-h-[300px] overflow-y-auto whitespace-pre-wrap flex flex-col gap-4">
            {logs
              .split("\n")
              .filter((line) => line.trim() !== "")
              .map((line, i) => (
                <div key={i} className="flex items-start gap-1">
                  <div className="min-w-6 min-h-6">
                    <FileClock className="w-5 h-5 mt-1.5" />
                  </div>
                  <div>{line}</div>
                </div>
              ))}
            {logs.trim() === "" && (
              <div className="italic">{intl.settings.noActivity}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
