import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

function isInvalidJwtError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ("code" in error && typeof error.code === "string") {
    return error.code.startsWith("ERR_JWS_") || error.code.startsWith("ERR_JWT_");
  }
  return false;
}

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
    const response = isLoginPage
      ? NextResponse.next()
      : NextResponse.redirect(new URL(`/${lang}/login`, request.url));

    response.cookies.set("yomimono_key", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    if (!isInvalidJwtError(err)) {
      console.error("[AUTH_MIDDLEWARE_ERROR]", err);
    }

    return response;
  }
}
