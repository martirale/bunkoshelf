import { i18nProxy } from "./proxies/i18n.js";
import { authProxy } from "./proxies/auth.js";
import { seoProxy } from "./proxies/seo.js";

export async function proxy(request) {
  const i18nRedirect = i18nProxy(request);
  if (i18nRedirect) return i18nRedirect;

  const authRedirect = await authProxy(request);
  if (authRedirect) return authRedirect;

  return seoProxy(request);
}

export const config = {
  matcher: ["/((?!_next|api|_vercel|.*\\..*).*)"],
};
