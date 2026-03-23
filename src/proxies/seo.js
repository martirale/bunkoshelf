import { NextResponse } from "next/server";

export function seoProxy(request) {
  const res = NextResponse.next();

  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
