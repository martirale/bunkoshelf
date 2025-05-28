"use client";

import Link from "next/link";
import { Languages, LogOut, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import SessionStatus from "@/hooks/SessionStatus";
import AlertBox from "@/ui/AlertBox";
import { getBuildInfo } from "@/lib/utils";

export default function FooterNav({ intl }) {
  const { version, versionUrl, changelogUrl } = getBuildInfo();
  const [remoteVersion, setRemoteVersion] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Lang options
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

  // Check current routes
  const isManga = pathname.startsWith(`/${currentLang}/manga`);
  const isBooks = pathname.startsWith(`/${currentLang}/books`);

  // Custom color borders
  const hoverBorder = isManga
    ? "hover:border-lilah"
    : isBooks
    ? "hover:border-ash"
    : "hover:border-pearl";

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout");
      window.location.href = `/${currentLang}/`;
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // Session status
  const isLoggedIn = SessionStatus();

  // Check version
  useEffect(() => {
    function isRemoteVersionNewer(local, remote) {
      const localParts = local.split(".").map(Number);
      const remoteParts = remote.split(".").map(Number);

      for (let i = 0; i < 3; i++) {
        if ((remoteParts[i] ?? 0) > (localParts[i] ?? 0)) return true;
        if ((remoteParts[i] ?? 0) < (localParts[i] ?? 0)) return false;
      }

      return false;
    }

    async function checkVersion() {
      try {
        const res = await fetch("https://bunko.amlab.site/version.json", {
          cache: "no-cache",
        });
        const data = await res.json();

        if (data.latest && isRemoteVersionNewer(version, data.latest)) {
          setRemoteVersion(data.latest);
          setUpdateAvailable(true);
        }
      } catch (err) {
        console.warn("No se pudo verificar la versión más reciente");
      }
    }

    checkVersion();
    const interval = setInterval(checkVersion, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {updateAvailable && (
        <Link href={changelogUrl} target="_blank" rel="noopener">
          <AlertBox
            title={`${intl.toastVersion.title} (${remoteVersion})`}
            description={intl.toastVersion.description}
          />
        </Link>
      )}

      <AlertBox
        title={intl.toastDev.appDevelopTt}
        description={intl.toastDev.appDevelop}
        variant="warning"
      />

      <div className="flex justify-between items-center">
        <Link
          href={versionUrl}
          target="_blank"
          rel="noopener"
          className={`text-sm px-4 py-1 border border-zinc-800 rounded-full hover:text-pearl hover:bg-onix transition-all duration-300 ${hoverBorder}`}
        >
          v{version}
        </Link>
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            className={`border border-zinc-800 hover:text-pearl hover:bg-onix rounded-lg p-2 cursor-pointer transition-all duration-300 ${hoverBorder}`}
            aria-label="Switch Language"
            title={intl.tooltip.switchLang}
            onClick={toggleLang}
          >
            <Languages className="w-5 h-5" />
          </button>
          {/* Guides */}
          <Link
            href="https://bunko.amlab.site/referencia/app"
            target="_blank"
            rel="noopener"
            title={intl.tooltip.userGuide}
            className={`border border-zinc-800 rounded-lg p-2 hover:text-pearl hover:bg-onix transition-all duration-300 ${hoverBorder}`}
          >
            <BookOpen className="w-5 h-5" />
          </Link>
          {/* Logout Button */}
          {isLoggedIn && (
            <button
              className={`border border-zinc-800 hover:text-pearl hover:bg-onix rounded-lg p-2 cursor-pointer transition-all duration-300 ${hoverBorder}`}
              aria-label="Logout"
              title={intl.tooltip.logout}
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
