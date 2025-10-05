import fs from "fs/promises";
import path from "path";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const rawPath = searchParams.get("path");

  if (!rawPath) {
    return new Response("Missing path", { status: 400 });
  }

  try {
    const filePath = decodeURIComponent(rawPath);
    const ext = path.extname(filePath).toLowerCase();

    // Leer la imagen desde el sistema de archivos
    const imageBuffer = await fs.readFile(filePath);

    // Detectar tipo de imagen
    const contentType =
      {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
      }[ext] || "application/octet-stream";

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Image serving error:", err);
    return new Response("Error reading image", { status: 500 });
  }
}
