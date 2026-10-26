"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { BookOpenIcon, ExternalLinkIcon, FileTextIcon, InfoIcon, ScaleIcon, ShieldCheckIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import AboutVersion from "./AboutVersion";
import software from "@/lib/thirdPartySoftware.json";
import type { VersionInfo } from "@/lib/versionInfo";
import type { Dictionary } from "@/lib/types";

interface AboutDialogProps {
  intl: Dictionary;
  versionData: VersionInfo;
  app: { author: { name: string; url: string }; copyright: string; license: string; repository: string };
}

export default function AboutDialog({ intl, versionData, app }: AboutDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const labels = intl.settings as Record<string, string>;

  function close() {
    setIsOpen(false);
    trigger.current?.focus();
  }

  return <>
    <Button ref={trigger} type="button" variant="accent" size="action" onClick={() => setIsOpen(true)} className="gap-2">
      <InfoIcon size={20} aria-hidden="true" />{labels.aboutButton}
    </Button>
    <Modal isOpen={isOpen} onClose={close}>
      <div role="dialog" aria-modal="true" aria-label={labels.aboutTitle} aria-describedby="about-description" className="w-full max-h-[70dvh] overflow-y-auto space-y-6 text-left text-base md:text-lg">
        <header className="flex flex-col items-center gap-3 border-b border-onix/15 pb-6 text-center">
          <Image src="/logos/BunkoShelfOnix.svg" alt="" width={220} height={44} className="w-52 max-w-full h-auto" />
          <p id="about-description" className="text-onix/75">{labels.aboutDescription}</p>
          <AboutVersion versionData={versionData} label={labels.aboutVersion} />
          {versionData.buildDate && <p className="text-onix/70">{labels.buildDate}: {versionData.buildDate}</p>}
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-lg bg-sand p-4 space-y-3">
            <h3 className="flex items-center gap-2 text-lg md:text-xl"><ScaleIcon size={22} aria-hidden="true" />{labels.aboutCopyright}</h3>
            <p>{app.copyright}</p>
            <a href={app.author.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">{app.author.name}<ExternalLinkIcon size={16} aria-hidden="true" /></a>
          </section>
          <section className="rounded-lg bg-sand p-4 space-y-3">
            <h3 className="flex items-center gap-2 text-lg md:text-xl"><ShieldCheckIcon size={22} aria-hidden="true" />{labels.aboutLicense}</h3>
            <p className="font-bold break-words">{app.license}</p>
            <p className="leading-relaxed">{labels.aboutLicenseDescription}</p>
            <a href={`${app.repository}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">{labels.aboutReadLicense}<ExternalLinkIcon size={16} aria-hidden="true" /></a>
          </section>
        </div>
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg md:text-xl"><FileTextIcon size={22} aria-hidden="true" />{labels.aboutLegalNotice}</h3>
          <p className="rounded-lg bg-sand p-4 leading-relaxed">{labels.aboutLegalDescription}</p>
        </section>
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg md:text-xl"><BookOpenIcon size={22} aria-hidden="true" />{labels.aboutThirdParty}</h3>
          <p className="text-onix/75">{labels.aboutDependenciesDescription}</p>
          <ul className="max-h-72 overflow-y-auto rounded-lg border border-onix/15 divide-y divide-onix/15">
            {software.dependencies.map((dependency) => <li key={dependency.name} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <span className="min-w-0 break-all"><span className="font-bold">{dependency.name}</span> <span className="text-onix/65">{dependency.version}</span></span>
              <span className="rounded bg-sand px-2 py-1">{dependency.license ?? labels.aboutLicenseUnknown}</span>
            </li>)}
          </ul>
          <a href="/third-party-notices.txt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">{labels.aboutReadNotices}<ExternalLinkIcon size={16} aria-hidden="true" /></a>
        </section>
        <footer className="border-t border-onix/15 pt-4 space-y-4 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <a href={app.repository} target="_blank" rel="noopener noreferrer" className="hover:underline">{labels.aboutRepository}</a>
            <a href="https://bunko.alemartir.com" target="_blank" rel="noopener noreferrer" className="hover:underline">{labels.aboutDocumentation}</a>
            <a href={`${app.repository}/issues`} target="_blank" rel="noopener noreferrer" className="hover:underline">{labels.aboutReportIssue}</a>
          </div>
          <p>{labels.aboutDevelopedBy} <a href={app.author.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{app.author.name}</a></p>
        </footer>
      </div>
    </Modal>
  </>;
}
