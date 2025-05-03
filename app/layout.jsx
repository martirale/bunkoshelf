import "./globals.css";
import { Boldonse } from "next/font/google";

const boldonse = Boldonse({
  subsets: ["latin"],
});

export const metadata = {
  title: "Bunko Shelf",
  description: "A web manga a ebook reader.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={boldonse.className}>
      <body>{children}</body>
    </html>
  );
}
