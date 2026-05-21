"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import SessionStatus from "@/hooks/SessionStatus";
import AlertBox from "@/components/ui/AlertBox";
import { logout } from "@/actions/logout";
import { getVersion } from "@/actions/version";
import { getFooterButtons } from "@/lib/nav/footerNav";
import type { Dictionary, Session } from "@/lib/types";
import type { VersionInfo } from "@/lib/versionInfo";

interface FooterNavProps {
  lang: string;
  intl: Dictionary;
  user: Session | null;
  versionData: VersionInfo;
}

export default function FooterNav({
  lang,
  intl,
  user,
  versionData,
}: FooterNavProps) {
  const [latestVersion, setLatestVersion] = useState<string | null>(
    versionData.latestVersion,
  );
  const [updateAvailable, setUpdateAvailable] = useState(
    versionData.updateAvailable,
  );
  const [changelogUrl, setChangelogUrl] = useState(versionData.changelogUrl);
  const currentVersion = versionData.currentVersion;

  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentLang = (params.lang as string) || "es";

  const toggleLang = () => {
    const newLang = currentLang === "es" ? "en" : "es";
    const pathWithoutLang = pathname.replace(`/${currentLang}`, "");
    document.cookie = `lang=${newLang}; path=/`;
    router.push(`/${newLang}${pathWithoutLang}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = `/${currentLang}/`;
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const isLoggedIn = SessionStatus();

  useEffect(() => {
    async function checkVersion() {
      try {
        const data = await getVersion();
        if (!data || "error" in data) return;
        setLatestVersion(data.latestVersion);
        setUpdateAvailable(data.updateAvailable);
        setChangelogUrl(data.changelogUrl);
      } catch {
        console.warn("No se pudo verificar la versión más reciente");
      }
    }

    checkVersion();
    const interval = setInterval(checkVersion, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  const buttons = getFooterButtons({
    intl,
    lang,
    user,
    isLoggedIn,
    onToggleLang: toggleLang,
    onLogout: handleLogout,
  });

  return (
    <>
      {updateAvailable && (
        <div className="text-sand mb-4">
          <a href={changelogUrl} target="_blank" rel="noopener">
            <AlertBox
              title={`${intl.toastVersion.title as string} (${latestVersion})`}
              description={intl.toastVersion.description as string}
            />
          </a>
        </div>
      )}

      <div className="flex justify-between items-end">
        <a
          href={versionData.versionUrl}
          target="_blank"
          rel="noopener"
          className="text-sm px-4 py-1 border border-stone-300 md:border-neutral-800 rounded-full hover:text-pearl transition-all duration-300 hover:border-lilah"
        >
          {currentVersion}
        </a>

        <div className="flex items-center gap-2">
          {buttons.map((btn, i) => {
            const Icon = btn.icon;
            if (btn.type === "button") {
              return (
                <button
                  key={i}
                  onClick={btn.onClick}
                  title={btn.title}
                  className="border border-stone-300 md:border-neutral-800 hover:text-pearl rounded-lg p-2 cursor-pointer transition-all duration-300 hover:border-lilah"
                >
                  <Icon size={20} />
                </button>
              );
            }
            return (
              <Link
                key={i}
                href={btn.href}
                target={btn.target}
                rel="noopener"
                title={btn.title}
                className="border border-stone-300 md:border-neutral-800 rounded-lg p-2 hover:text-pearl transition-all duration-300 hover:border-lilah"
              >
                <Icon size={20} />
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
