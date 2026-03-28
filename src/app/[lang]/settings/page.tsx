import { getDictionary } from "@/lib/i18n/Dictionary";
import {
  BoltIcon,
  FileClockIcon,
  GitCommitHorizontalIcon,
  CalendarIcon,
  UsersRoundIcon,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/verifySession";
import ClearLogsButton from "@/components/settings/ClearLogsButton";
import UsersTable from "@/components/settings/UsersTable";
import AddUserButton from "@/components/settings/AddUserButton";
import { getVersionInfo } from "@/lib/versionInfo";
import { getLogs } from "@/actions/admin-logs";
import type { Locale, Dictionary } from "@/lib/types";

interface SettingsPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { lang = "es" } = await params;
  const intl: Dictionary = await getDictionary(lang);

  const currentUser = await verifySession();
  const logsResult = await getLogs();
  const logs = logsResult?.logs || "No se pudieron cargar los logs.";
  const versionData = await getVersionInfo();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      isAdmin: true,
      role: true,
      name: true,
      lastname: true,
      birthYear: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <>
      <div id="overview" />
      <h2 className="flex items-center mb-4">
        <BoltIcon size={28} className="mr-2" />
        {intl.settings.overview as string}
      </h2>

      <div className="flex flex-col 2xl:flex-row gap-4">
        <div className="2xl:flex-1/2">
          <div className="bg-blackamber p-4 rounded-lg h-64 2xl:h-96 flex flex-col justify-between">
            <div>
              <h3 className="text-base mb-2">{intl.settings.infoServerTt as string}</h3>
              <p>{intl.settings.infoServerDesc as string}</p>
            </div>

            <div className="flex items-center mt-4 gap-8 md:gap-12">
              <div>
                <p className="font-bold">{intl.settings.semVer as string}</p>
                <div className="flex items-center">
                  <GitCommitHorizontalIcon size={20} className="mr-2" />
                  <a
                    href={versionData.versionUrl}
                    target="_blank"
                    className="hover:underline"
                    rel="noopener noreferrer"
                  >
                    {versionData.version}
                  </a>
                </div>
              </div>

              {versionData.buildDate && (
                <div>
                  <p className="font-bold">{intl.settings.buildDate as string}</p>
                  <div className="flex items-center">
                    <CalendarIcon size={16} className="mr-2" />
                    <span>{versionData.buildDate}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-blackamber rounded-lg p-4 2xl:flex-1/2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base">{intl.settings.ttActivity as string}</h2>
            <ClearLogsButton />
          </div>
          <div className="min-h-[300px] max-h-[300px] overflow-y-auto whitespace-pre-wrap flex flex-col gap-4">
            {logs
              .split("\n")
              .filter((line) => line.trim() !== "")
              .map((line, i) => (
                <div key={i} className="flex items-start gap-1">
                  <div className="min-w-6 min-h-6">
                    <FileClockIcon size={20} className="mt-1.5" />
                  </div>
                  <div>{line}</div>
                </div>
              ))}
            {logs.trim() === "" && (
              <div className="italic">{intl.settings.noActivity as string}</div>
            )}
          </div>
        </div>
      </div>

      <div id="users" />
      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="flex items-center">
          <UsersRoundIcon size={28} className="mr-2" />
          {intl.settings.users as string}
        </h2>

        <AddUserButton intl={intl} />
      </div>

      <UsersTable users={users} currentUserId={currentUser?.id} intl={intl} />
    </>
  );
}
