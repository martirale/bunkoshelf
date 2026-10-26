import Image from "next/image";
import { CalendarIcon } from "lucide-react";
import pkg from "../../../package.json";
import AboutDialog from "./AboutDialog";
import AboutVersion from "./AboutVersion";
import buildInfo from "@/lib/buildInfo.json";
import type { VersionInfo } from "@/lib/versionInfo";
import type { Dictionary } from "@/lib/types";

export default function ServerInfoCard({ intl, versionData }: { intl: Dictionary; versionData: VersionInfo }) {
  const labels = intl.settings as Record<string, string>;
  const copyright = `© ${buildInfo.firstCommitYear}-${buildInfo.buildYear} ${pkg.author.name}`;
  return (
    <section aria-label={labels.aboutTitle} className="bg-blackamber p-6 rounded-lg min-h-64 2xl:min-h-96 flex flex-col items-center justify-center gap-5 text-center text-base md:text-lg">
      <Image src="/logos/BunkoShelfPearl.svg" alt="Bunko Shelf" width={260} height={52} className="w-60 max-w-full h-auto" />
      <p className="text-sand/75">{labels.aboutDescription}</p>
      <div className="space-y-2">
        <AboutVersion versionData={versionData} label={labels.aboutVersion} />
        {versionData.buildDate && <p className="flex items-center justify-center gap-2"><CalendarIcon size={16} aria-hidden="true" />{labels.buildDate}: {versionData.buildDate}</p>}
      </div>
      <AboutDialog intl={intl} versionData={versionData} app={{ author: pkg.author, copyright, license: pkg.license, repository: pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, "") }} />
      <p className="text-sand/75"><a href={pkg.author.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{copyright}</a></p>
    </section>
  );
}
