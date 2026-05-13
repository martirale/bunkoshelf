import localFont from "next/font/local";

export const robotoCondensed = localFont({
  src: [
    {
      path: "../../public/fonts/RobotoCondensed-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/RobotoCondensed-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-roboto-condensed",
});

export const boldonse = localFont({
  src: [
    {
      path: "../../public/fonts/Boldonse.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-boldonse",
  display: "swap",
});
