import { NextResponse, type NextRequest } from "next/server";

export function seoProxy(request: NextRequest): NextResponse {
  const res = NextResponse.next();

  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
