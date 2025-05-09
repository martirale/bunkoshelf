import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_SITE_URL)
  );
  response.cookies.set("yomimono_key", "", {
    path: "/",
    expires: new Date(0),
  });
  return response;
}
