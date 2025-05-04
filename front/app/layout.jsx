import { robotoCondensed, boldonse } from "./fonts";
import "./globals.css";
import Sidebar from "@/ui/sidebar";

export const metadata = {
  title: "Bunko Shelf",
  description: "Full web manga and book reader and library.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${robotoCondensed.variable} ${boldonse.variable}`}
    >
      <body>
        <div className="flex h-screen">
          <Sidebar />

          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
