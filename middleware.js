import { i18nMiddleware } from "./middlewares/i18n.js";
import { authMiddleware } from "./middlewares/auth.js";
import { seoMiddleware } from "./middlewares/seo.js";

export async function middleware(request) {
  const i18nRedirect = i18nMiddleware(request);
  if (i18nRedirect) return i18nRedirect;

  const authRedirect = await authMiddleware(request);
  if (authRedirect) return authRedirect;

  return seoMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|api|_vercel|.*\\..*).*)"],
};
