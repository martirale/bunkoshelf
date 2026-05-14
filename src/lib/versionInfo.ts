import pkg from "../../package.json";

const PACKAGE_NAME = "@itsmrtr/bunkoshelf";
const REPOSITORY_URL = "https://github.com/martirale/bunkoshelf";
const RELEASES_URL = `${REPOSITORY_URL}/releases`;
const REGISTRY_URL = `https://registry.npmjs.org/${encodeURIComponent(PACKAGE_NAME)}/latest`;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export interface VersionInfo {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  versionUrl: string;
  changelogUrl: string;
  buildDate: string | null;
}

interface RegistryVersionPayload {
  version?: string;
}

let cachedVersionInfo: { expiresAt: number; data: VersionInfo } | null = null;

function normalizeVersion(value: string): number[] {
  return value
    .trim()
    .replace(/^v/i, "")
    .split("-")[0]
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
}

function compareVersions(a: string, b: string): number {
  const left = normalizeVersion(a);
  const right = normalizeVersion(b);
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = left[index] ?? 0;
    const rightPart = right[index] ?? 0;

    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }

  return 0;
}

function getReleaseUrl(version: string): string {
  return `${RELEASES_URL}/tag/${version}`;
}

function getChangelogUrl(version: string | null): string {
  return version ? getReleaseUrl(version) : RELEASES_URL;
}

export async function getVersionInfo(): Promise<VersionInfo> {
  if (cachedVersionInfo && cachedVersionInfo.expiresAt > Date.now()) {
    return cachedVersionInfo.data;
  }

  const currentVersion = pkg.version;
  let latestVersion: string | null = null;

  try {
    const response = await fetch(REGISTRY_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (response.ok) {
      const payload = (await response.json()) as RegistryVersionPayload;
      latestVersion = payload.version ?? null;
    }
  } catch {}

  const versionInfo: VersionInfo = {
    currentVersion,
    latestVersion,
    updateAvailable: latestVersion
      ? compareVersions(latestVersion, currentVersion) > 0
      : false,
    versionUrl: getReleaseUrl(currentVersion),
    changelogUrl: getChangelogUrl(latestVersion),
    buildDate: null,
  };

  cachedVersionInfo = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data: versionInfo,
  };

  return versionInfo;
}
