import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function authProxy(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const langMatch = pathname.match(/^\/(es|en)/);
  const lang = langMatch?.[1] || "es";

  const cookiesInstance = await request.cookies;
  const token = cookiesInstance.get("yomimono_key")?.value;

  const isLoginPage = pathname === `/${lang}/login`;

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

    if (isLoginPage) {
      return NextResponse.redirect(new URL(`/${lang}/`, request.url));
    }

    const isAdminUser = payload.isAdmin === true || payload.role === "ADMIN";
    if (pathname.startsWith(`/${lang}/settings`) && !isAdminUser) {
      return NextResponse.redirect(new URL(`/${lang}/`, request.url));
    }

    return null;
  } catch (err) {
    console.error("[AUTH_MIDDLEWARE_ERROR]", err);
    return NextResponse.redirect(new URL(`/${lang}/login`, request.url));
  }
}
