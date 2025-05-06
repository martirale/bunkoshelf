import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "bunkoshelf-secret";

export async function adminMiddleware(request) {
  const { pathname } = request.nextUrl;

  const pathRegex = /^\/(es|en)\/settings(\/|$)/;
  if (!pathRegex.test(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    if (!payload.isAdmin) {
      return NextResponse.redirect(
        new URL(`/${pathname.split("/")[1]}/`, request.url)
      );
    }

    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
