import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { robotoCondensed, boldonse } from "../fonts";
import "../globals.css";
import Sidebar from "@/components/sidebar/sidebar";
import MobNav from "@/components/mobNav/MobNav";
import { ToastProvider } from "@/components/ToastProvider";
import { AlertDialogProvider } from "@/components/AlertDialogProvider";
import PwaProvider from "@/components/pwa/PwaProvider";
import OfflineGate from "@/components/pwa/OfflineGate";
import { verifySession } from "@/lib/auth/verifySession";
import { getDictionary } from "@/lib/i18n/Dictionary";
import { getChallengeData } from "@/lib/utils";
import { getVersionInfo } from "@/lib/versionInfo";
import { getLibrarySectionCounts } from "@/lib/db/library";
import { getAppSettings } from "@/lib/db/appSettings";
import { getContentVisibilityPolicy } from "@/lib/parentalControl";
import type { Locale } from "@/lib/types";
import type { ReactNode } from "react";
import type { Metadata } from "next";

const VALID_LOCALES: Locale[] = ["es", "en"];

export const metadata: Metadata = {
  title: "Bunko Shelf",
  description: "Self-hosted server for managing-reading manga & ebooks.",
  icons: {
    icon: "/favicon.png",
    apple: "/icons/bunkoshelf-icon-any.png",
  },
  manifest: "/manifest.webmanifest",
};

export async function generateStaticParams() {
  return [{ lang: "es" }, { lang: "en" }];
}

interface RootLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

async function AppShell({
  children,
  lang,
}: {
  children: ReactNode;
  lang: Locale;
}) {
  await connection();

  const [intl, user, versionData, libraryCounts, appSettings] = await Promise.all([
    getDictionary(lang),
    verifySession(),
    getVersionInfo(),
    getLibrarySectionCounts(),
    getAppSettings(),
  ]);
  const challengeData = user?.role === "GUEST" ? null : await getChallengeData(user);

  return (
    <>
      <MobNav
        lang={lang}
        intl={intl}
        user={user}
        challengeData={challengeData}
        versionData={versionData}
        libraryCounts={libraryCounts}
      />
      <Sidebar
        lang={lang}
        intl={intl}
        user={user}
        challengeData={challengeData}
        versionData={versionData}
        libraryCounts={libraryCounts}
      />
      <main className="w-full md:w-[65%] lg:w-[75%] xl:w-[79%] 2xl:w-[83%] flex flex-col overflow-y-auto">
        <PwaProvider userId={user?.id} contentVisibility={getContentVisibilityPolicy(user, appSettings.parentalControlEnabled, appSettings.parentalControlMode)}>
          <ToastProvider>
            <AlertDialogProvider
              labels={{
                alertTitle: intl.alerts.alertTitle as string,
                confirmTitle: intl.alerts.confirmTitle as string,
                confirmEyebrow: intl.alerts.confirmEyebrow as string,
                destructiveEyebrow: intl.alerts.destructiveEyebrow as string,
                irreversibleDescription: intl.alerts.irreversibleDescription as string,
                confirm: intl.alerts.confirm as string,
                cancel: intl.alerts.cancel as string,
                close: intl.alerts.close as string,
              }}
            >
              <OfflineGate lang={lang} intl={intl} user={user}>
                {children}
              </OfflineGate>
            </AlertDialogProvider>
          </ToastProvider>
        </PwaProvider>
      </main>
    </>
  );
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { lang: rawLang } = await params;

  if (!VALID_LOCALES.includes(rawLang as Locale)) notFound();

  const lang = rawLang as Locale;

  return (
    <html
      lang={lang || "es"}
      className={`${robotoCondensed.variable} ${boldonse.variable} antialiased`}
    >
      <head>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="googlebot" content="noindex,nofollow" />
      </head>

      <body className="flex h-screen overflow-hidden text-lg relative">
        <div className="fixed inset-0 -z-10 pointer-events-none bg-seigaiha-pattern-k opacity-50" />

        <Suspense
          fallback={(
            <>
              <aside className="hidden md:flex md:w-[35%] lg:w-[25%] xl:w-[21%] 2xl:w-[17%] bg-blackamber flex-col" />
              <main className="w-full md:w-[65%] lg:w-[75%] xl:w-[79%] 2xl:w-[83%] flex flex-col overflow-y-auto" />
            </>
          )}
        >
          <AppShell lang={lang}>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
