import path from "path";
import fs from "fs/promises";

export async function GET(req, contextPromise) {
  const { params } = await contextPromise;
  const segments = params?.slug;

  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    return new Response("Missing or invalid path", { status: 400 });
  }

  const requestedPath = path.join(
    process.cwd(),
    "public",
    "covers",
    ...segments
  );

  try {
    await fs.access(requestedPath);
    const file = await fs.readFile(requestedPath);
    const contentType = getContentType(requestedPath);

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    const fallbackPath = path.join(process.cwd(), "public", "placeholder.svg");
    try {
      const fallbackFile = await fs.readFile(fallbackPath);
      return new Response(fallbackFile, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return new Response(
        JSON.stringify({ error: "Image not found and no fallback available" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
