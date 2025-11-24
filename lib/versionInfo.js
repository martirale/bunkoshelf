import pkg from "../package.json";

export async function getVersionInfo() {
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
      versionUrl: `https://hub.docker.com/r/itsmrtr/bunkoshelf/tags?page=1&name=${localVersion}`,
      changelogUrl: null,
      buildDate: null,
    };
  }

  return await res.json();
}
