"use client";

import Link from "next/link";
import {
  LanguagesIcon,
  LogOutIcon,
  BookOpenIcon,
  Settings2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import SessionStatus from "@/hooks/SessionStatus";
import AlertBox from "@/components/ui/AlertBox";
import pkg from "../../package.json";

export default function FooterNav({ lang, intl, user }) {
  const localVersion = pkg.version;
  const [remoteVersion, setRemoteVersion] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [remoteChangelog, setRemoteChangelog] = useState(null);
  const [remoteVersionUrl, setRemoteVersionUrl] = useState(null);

  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentLang = params.lang || "es";

  const toggleLang = () => {
    const newLang = currentLang === "es" ? "en" : "es";
    const pathWithoutLang = pathname.replace(`/${currentLang}`, "");
    document.cookie = `lang=${newLang}; path=/`;
    router.push(`/${newLang}${pathWithoutLang}`);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout");
      window.location.href = `/${currentLang}/`;
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const isLoggedIn = SessionStatus();

  useEffect(() => {
    function isRemoteVersionNewer(local, remote) {
      if (!local || !remote) return false;
      const localParts = String(local)
        .split(".")
        .map((p) => Number(p) || 0);
      const remoteParts = String(remote)
        .split(".")
        .map((p) => Number(p) || 0);
      const len = Math.max(localParts.length, remoteParts.length);
      for (let i = 0; i < len; i++) {
        const r = remoteParts[i] ?? 0;
        const l = localParts[i] ?? 0;
        if (r > l) return true;
        if (r < l) return false;
      }
      return false;
    }

    async function checkVersion() {
      try {
        const res = await fetch("/api/version", { cache: "no-cache" });
        const data = await res.json();
        const remote = data.version ?? data.latest ?? null;
        const changelog =
          data.changelogUrl ?? data.changelog_url ?? data.url ?? null;
        const versionUrl = data.versionUrl ?? data.version_url ?? null;

        if (remote) {
          setRemoteVersion(remote);
          if (changelog) setRemoteChangelog(changelog);
          if (versionUrl) setRemoteVersionUrl(versionUrl);
          if (isRemoteVersionNewer(localVersion, remote)) {
            setUpdateAvailable(true);
          } else {
            setUpdateAvailable(false);
          }
        }
      } catch (err) {
        console.warn("No se pudo verificar la versión más reciente");
      }
    }

    checkVersion();
    const interval = setInterval(checkVersion, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const buttons = [
    {
      type: "link",
      icon: BookOpenIcon,
      href: "https://bunko.am25.app/guides",
      target: "_blank",
      title: intl.tooltip.userGuide,
    },
    {
      type: "button",
      icon: LanguagesIcon,
      title: intl.tooltip.switchLang,
      onClick: toggleLang,
    },
    ...(user?.isAdmin
      ? [
          {
            type: "link",
            icon: Settings2Icon,
            href: `/${lang}/settings`,
            target: "_self",
            title: intl.tooltip.settings,
          },
        ]
      : []),
    ...(isLoggedIn
      ? [
          {
            type: "button",
            icon: LogOutIcon,
            title: intl.tooltip.logout,
            onClick: handleLogout,
          },
        ]
      : []),
  ];

  return (
    <>
      {updateAvailable && (
        <div className="text-sand mb-4">
          <Link
            href={remoteChangelog || remoteVersionUrl || "#"}
            target="_blank"
            rel="noopener"
          >
            <AlertBox
              title={`${intl.toastVersion.title} (${remoteVersion})`}
              description={intl.toastVersion.description}
            />
          </Link>
        </div>
      )}

      <div className="flex justify-between items-end">
        <Link
          href={`https://hub.docker.com/r/itsmrtr/bunkoshelf/tags?page=1&name=${localVersion}`}
          target="_blank"
          rel="noopener"
          className="text-sm px-4 py-1 border border-stone-300 md:border-neutral-800 rounded-full hover:text-pearl transition-all duration-300 hover:border-lilah"
        >
          {localVersion}
        </Link>

        <div className="flex items-center gap-2">
          {buttons.map(({ type, icon: Icon, ...props }, i) =>
            type === "button" ? (
              <button
                key={i}
                {...props}
                className="border border-stone-300 md:border-neutral-800 hover:text-pearl rounded-lg p-2 cursor-pointer transition-all duration-300 hover:border-lilah"
              >
                <Icon size={20} />
              </button>
            ) : (
              <Link
                key={i}
                href={props.href}
                target={props.target}
                rel="noopener"
                title={props.title}
                className="border border-stone-300 md:border-neutral-800 rounded-lg p-2 hover:text-pearl transition-all duration-300 hover:border-lilah"
              >
                <Icon size={20} />
              </Link>
            )
          )}
        </div>
      </div>
    </>
  );
}
