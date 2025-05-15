import { robotoCondensed, boldonse } from "../fonts";
import "../globals.css";
import Sidebar from "@/components/sidebar/sidebar";
import { ToastProvider } from "@/ui/toast/ToastProvider";

export const metadata = {
  title: "Bunko Shelf",
  description: "Self-hosted server for managing-reading manga & ebooks.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export async function generateStaticParams() {
  return [{ lang: "es" }, { lang: "en" }];
}

export default async function RootLayout({ children, params }) {
  const { lang } = await params;

  return (
    <html
      lang={lang || "es"}
      className={`${robotoCondensed.variable} ${boldonse.variable}`}
    >
      <body className="flex h-screen overflow-hidden text-lg">
        <Sidebar lang={lang} />

        <main className="w-full md:w-9/12 2xl:w-10/12 flex flex-col overflow-y-auto">
          <ToastProvider>{children}</ToastProvider>
        </main>
      </body>
    </html>
  );
}
