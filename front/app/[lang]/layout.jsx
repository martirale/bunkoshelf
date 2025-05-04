import { robotoCondensed, boldonse } from "../fonts";
import "../globals.css";
import Sidebar from "@/components/sidebar/sidebar";

export const metadata = {
  title: "Bunko Shelf",
  description: "Full web manga and book reader and library.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export async function generateStaticParams() {
  return [{ lang: "es" }, { lang: "en" }];
}

export default function RootLayout({ children, params }) {
  return (
    <html
      lang={params.lang}
      className={`${robotoCondensed.variable} ${boldonse.variable}`}
    >
      <body className="flex h-screen overflow-hidden">
        <Sidebar />

        <main className="w-full md:w-10/12 flex flex-col overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
