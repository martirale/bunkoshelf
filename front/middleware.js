import { handleI18nMiddleware } from "./middlewares/i18n.js";
import { authMiddleware } from "./middlewares/auth.js";

export function middleware(request) {
  const i18nRedirect = handleI18nMiddleware(request);
  if (i18nRedirect) return i18nRedirect;

  return authMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|api|_vercel|.*\\..*).*)"],
};
