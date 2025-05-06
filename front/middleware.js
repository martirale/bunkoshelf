import { i18nMiddleware } from "./middlewares/i18n.js";
import { authMiddleware } from "./middlewares/auth.js";

export function middleware(request) {
  const i18nRedirect = i18nMiddleware(request);
  if (i18nRedirect) return i18nRedirect;

  const authRedirect = authMiddleware(request);
  if (authRedirect) return authRedirect;

  return null;
}

export const config = {
  matcher: ["/((?!_next|api|_vercel|.*\\..*).*)"],
};
