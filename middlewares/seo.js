import { NextResponse } from "next/server";

export function seoMiddleware(request) {
  const res = NextResponse.next();

  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
