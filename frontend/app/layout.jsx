import { Roboto_Condensed } from "next/font/google";
import "./globals.css";

const robotoCondensed = Roboto_Condensed({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Bunko Shelf",
  description: "A web manga a ebook reader.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={robotoCondensed.className}>
      <body>{children}</body>
    </html>
  );
}
