import type { VersionInfo } from "@/lib/versionInfo";

export default function AboutVersion({ versionData, label }: { versionData: VersionInfo; label: string }) {
  return (
    <p>
      {label} {versionData.currentVersion}
      {versionData.gitSha && <> · <a href={versionData.versionUrl} target="_blank" rel="noopener noreferrer" title={versionData.gitSha} className="font-mono underline underline-offset-4">{versionData.gitSha.slice(0, 7)}</a></>}
    </p>
  );
}
