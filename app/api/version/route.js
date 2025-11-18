import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";

let cached = { timestamp: 0, data: null };

export async function GET() {
  let _err;
  let response = null;
  try {
    const user = await verifySession();
    if (!user) {
      response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000;
      if (cached.data && now - cached.timestamp < maxAge) {
        response = new Response(JSON.stringify(cached.data), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=86400",
          },
        });
      } else {
        const res = await fetch("https://bunko.am25.app/api/version", {
          cache: "no-cache",
        });
        if (!res.ok) throw new Error("Remote fetch failed");
        const data = await res.json();
        cached = { timestamp: Date.now(), data };
        response = new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }
  } catch (e) {
    _err = e;
  } finally {
    if (_err) {
      if (cached.data) {
        return new Response(JSON.stringify(cached.data), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
      return NextResponse.json(
        {
          error: "Unable to fetch remote version",
          message: _err?.message ?? null,
        },
        { status: 502 }
      );
    }
    return response;
  }
}
