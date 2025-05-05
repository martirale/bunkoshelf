import { NextResponse } from "next/server";

export function authMiddleware(request) {
  const { cookies, nextUrl } = request;

  const jwt = cookies.get("token")?.value;

  // If the token exists, let it through
  if (jwt) {
    return NextResponse.next();
  }

  const lang = nextUrl.pathname.split("/")[1] || "es";

  // We check if we are already on the login page to avoid loops
  if (nextUrl.pathname === `/${lang}/login`) {
    return NextResponse.next();
  }

  // If we are not logged in, we redirect to the login page
  const loginUrl = `${nextUrl.origin}/${lang}/login`;
  return NextResponse.redirect(loginUrl);
}
