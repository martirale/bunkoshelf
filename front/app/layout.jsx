import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/ui/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Bunko Shelf",
  description: "Full web manga and book reader and library.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex h-screen">
          <Sidebar />

          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
