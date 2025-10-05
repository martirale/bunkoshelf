import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

const locales = ["es", "en"];
const defaultLocale = "es";

function getLocale(request) {
  // Verifica si ya hay una cookie de idioma
  const cookieLocale = request.cookies.get("lang")?.value;
  if (cookieLocale && locales.includes(cookieLocale)) return cookieLocale;

  // Si no, negocia por headers
  const negotiatorHeaders = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();

  return match(languages, locales, defaultLocale);
}

export function i18nMiddleware(request) {
  const pathname = request.nextUrl.pathname;

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    const locale = getLocale(request);

    const response = NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    );

    response.cookies.set("lang", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  }

  return null;
}
