import type { NextRequest } from "next/server";
import { i18nProxy } from "./proxies/i18n";
import { authProxy } from "./proxies/auth";
import { seoProxy } from "./proxies/seo";

export async function proxy(request: NextRequest) {
  const i18nRedirect = i18nProxy(request);
  if (i18nRedirect) return i18nRedirect;

  const authRedirect = await authProxy(request);
  if (authRedirect) return authRedirect;

  return seoProxy(request);
}

export const config = {
  matcher: ["/((?!_next|api|_vercel|.*\\..*).*)"],
};
