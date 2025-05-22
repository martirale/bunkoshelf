import path from "path";
import fs from "fs/promises";

export async function GET(req, context) {
  const { params } = context;
  const segments = params.slug;

  if (!segments || segments.length === 0) {
    return new Response("Missing path", { status: 400 });
  }

  // Ruta final del archivo solicitado
  const requestedPath = path.join(
    process.cwd(),
    "public",
    "covers",
    ...segments
  );

  try {
    await fs.stat(requestedPath);
    const file = await fs.readFile(requestedPath);
    const contentType = getContentType(requestedPath);

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (err) {
    // Si no existe, devolver el placeholder
    const fallbackPath = path.join(process.cwd(), "public", "placeholder.svg");
    try {
      const fallbackFile = await fs.readFile(fallbackPath);
      return new Response(fallbackFile, {
        headers: {
          "Content-Type": "image/svg+xml",
        },
      });
    } catch {
      return new Response("Image not found and no fallback available", {
        status: 404,
      });
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
