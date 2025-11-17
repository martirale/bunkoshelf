let cached = { timestamp: 0, data: null };

export async function GET() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000;
  if (cached.data && now - cached.timestamp < maxAge) {
    return new Response(JSON.stringify(cached.data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  let data = null;
  let err = null;

  try {
    const res = await fetch("http://localhost:3001/api/version", {
      cache: "no-cache",
    });
    if (!res.ok) throw new Error("Remote fetch failed");
    data = await res.json();
    cached = { timestamp: Date.now(), data };
  } catch (e) {
    err = e;
  } finally {
    if (data) {
      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
    if (cached.data) {
      return new Response(JSON.stringify(cached.data), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
    return new Response(
      JSON.stringify({
        error: "Unable to fetch remote version",
        message: err?.message ?? null,
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
