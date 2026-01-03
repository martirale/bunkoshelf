import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

const locales = ["es", "en"];
const defaultLocale = "es";

function getLocale(request) {
  const cookieLocale = request.cookies.get("lang")?.value;
  if (cookieLocale && locales.includes(cookieLocale)) return cookieLocale;

  const negotiatorHeaders = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  let languages = [];
  try {
    languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  } catch (err) {
    console.error("[I18N_NEGOTIATOR_ERROR]", err);
    return defaultLocale;
  }

  const validLanguages = languages.filter((lang) => {
    try {
      Intl.getCanonicalLocales(lang);
      return true;
    } catch {
      return false;
    }
  });

  if (validLanguages.length === 0) return defaultLocale;

  try {
    return match(validLanguages, locales, defaultLocale);
  } catch (err) {
    console.error("[I18N_MATCH_ERROR]", err);
    return defaultLocale;
  }
}

export function i18nProxy(request) {
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
