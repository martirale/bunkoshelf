import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function authMiddleware(request) {
  const { pathname } = request.nextUrl;
  const langMatch = pathname.match(/^\/(es|en)/);
  const lang = langMatch?.[1] || "es";

  const token = request.cookies.get("yomimono_key")?.value;

  const isLoginPage = pathname === `/${lang}/login`;

  // If there is no token
  if (!token) {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL(`/${lang}/login`, request.url));
    }
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    // If there is a valid token and you go to login, redirect to home
    if (isLoginPage) {
      return NextResponse.redirect(new URL(`/${lang}/`, request.url));
    }

    // If you try to access /settings without being admin
    if (pathname.startsWith(`/${lang}/settings`) && !payload.isAdmin) {
      return NextResponse.redirect(new URL(`/${lang}/`, request.url));
    }

    return null;
  } catch (err) {
    console.error("[AUTH_MIDDLEWARE_ERROR]", err);
    return NextResponse.redirect(new URL(`/${lang}/login`, request.url));
  }
}
