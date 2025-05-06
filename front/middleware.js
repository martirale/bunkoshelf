import { i18nMiddleware } from "./middlewares/i18n.js";
import { authMiddleware } from "./middlewares/auth.js";
import { adminMiddleware } from "./middlewares/admin.js";

export function middleware(request) {
  // First, we handle the language logic
  const i18nRedirect = i18nMiddleware(request);
  if (i18nRedirect) return i18nRedirect;

  // Then, we process the authentication
  const authRedirect = authMiddleware(request);
  if (authRedirect) return authRedirect;

  // Finally, we process the protection for admin routes
  const adminRedirect = adminMiddleware(request);
  if (adminRedirect) return adminRedirect;

  return null;
}

export const config = {
  matcher: ["/((?!_next|api|_vercel|.*\\..*).*)"],
};
