import { NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/", "/settings", "/settings/users"];

export function handleAuthMiddleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login")) return;

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) return;

  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }
}
