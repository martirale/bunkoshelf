import { handleI18nMiddleware } from "./middlewares/i18n.js";

export function middleware(request) {
  return handleI18nMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|api|_vercel|.*\\..*).*)"],
};
