import { Suspense } from "react";
import { notFound } from "next/navigation";
import { robotoCondensed, boldonse } from "../fonts";
import "../globals.css";
import Sidebar from "@/components/sidebar/sidebar";
import MobNav from "@/components/mobNav/MobNav";
import { ToastProvider } from "@/components/ToastProvider";

const VALID_LOCALES = ["es", "en"];

export const metadata = {
  title: "Bunko Shelf",
  description: "Self-hosted server for managing-reading manga & ebooks.",
  icons: {
    icon: "/favicon.png",
    apple: "/pwa/bunkoshelf-icon-192.png",
  },
  manifest: "/manifest.json",
};

export async function generateStaticParams() {
  return [{ lang: "es" }, { lang: "en" }];
}

export default async function RootLayout({ children, params }) {
  const { lang } = await params;

  if (!VALID_LOCALES.includes(lang)) notFound();

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

        <Suspense>
          <MobNav lang={lang} />
        </Suspense>
        <Suspense fallback={<aside className="hidden md:flex md:w-[35%] lg:w-[25%] xl:w-[21%] 2xl:w-[17%] bg-blackamber" />}>
          <Sidebar lang={lang} />
        </Suspense>

        <main className="w-full md:w-[65%] lg:w-[75%] xl:w-[79%] 2xl:w-[83%] flex flex-col overflow-y-auto">
          <Suspense>
            <ToastProvider>
              {children}
            </ToastProvider>
          </Suspense>
        </main>
      </body>
    </html>
  );
}
