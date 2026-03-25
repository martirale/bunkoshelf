import { NextResponse, type NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import type { Locale } from "@/lib/types";

const locales: Locale[] = ["es", "en"];
const defaultLocale: Locale = "es";

function getLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get("lang")?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale))
    return cookieLocale as Locale;

  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  let languages: string[] = [];
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
    return match(validLanguages, locales, defaultLocale) as Locale;
  } catch (err) {
    console.error("[I18N_MATCH_ERROR]", err);
    return defaultLocale;
  }
}

export function i18nProxy(request: NextRequest): NextResponse | null {
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
