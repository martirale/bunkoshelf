import { Roboto_Condensed } from "next/font/google";
import localFont from "next/font/local";

// Google Font for body text
export const robotoCondensed = Roboto_Condensed({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-condensed",
});

export const boldonse = localFont({
  src: [
    {
      path: "../public/fonts/Boldonse.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-boldonse",
  display: "swap",
});
