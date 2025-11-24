import { robotoCondensed, boldonse } from "../fonts";
import "../globals.css";
import Sidebar from "@/components/sidebar/sidebar";
import MobNav from "@/components/mobNav/MobNav";
import { ToastProvider } from "@/components/ToastProvider";

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

  return (
    <html
      lang={lang || "es"}
      className={`${robotoCondensed.variable} ${boldonse.variable} antialiased`}
    >
      <body className="flex h-screen overflow-hidden text-lg relative">
        <div className="fixed inset-0 -z-10 pointer-events-none bg-seigaiha-pattern-k opacity-50" />

        <MobNav lang={lang} />
        <Sidebar lang={lang} />

        <main className="w-full md:w-9/12 2xl:w-10/12 flex flex-col overflow-y-auto">
          <ToastProvider>{children}</ToastProvider>
        </main>
      </body>
    </html>
  );
}
