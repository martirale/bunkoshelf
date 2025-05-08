import { i18nMiddleware } from "./middlewares/i18n.js";

export function middleware(request) {
  const i18nRedirect = i18nMiddleware(request);
  if (i18nRedirect) return i18nRedirect;

  return null;
}

export const config = {
  matcher: ["/((?!_next|api|_vercel|.*\\..*).*)"],
};
