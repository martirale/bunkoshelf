import pkg from "../../package.json";

export interface VersionInfo {
  version: string;
  versionUrl: string;
  changelogUrl: string | null;
  buildDate: string | null;
}

export async function getVersionInfo(): Promise<VersionInfo> {
  const localVersion = pkg.version;

  const res = await fetch(
    `https://bunko.am25.app/api/version?version=${localVersion}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return {
      version: localVersion,
      versionUrl: "https://bunko.am25.app",
      changelogUrl: null,
      buildDate: null,
    };
  }

  return await res.json();
}
