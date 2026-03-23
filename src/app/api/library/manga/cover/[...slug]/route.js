import path from "path";
import fs from "fs/promises";
import prisma from "@/lib/prisma";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";

const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";

export async function GET(req, contextPromise) {
  const context = await contextPromise;
  const params = await context.params;
  const segments = params?.slug;

  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    return servePlaceholder();
  }

  const volumeSlug = segments[0];

  const volume = await prisma.mangaVolume.findUnique({
    where: { slug: volumeSlug },
    select: {
      coverImage: true,
      series: {
        select: { path: true },
      },
    },
  });

  if (!volume || !volume.coverImage) {
    return servePlaceholder();
  }

  try {
    if (LIB_PROVIDER === "cloud") {
      const seriesPath = volume.series.path.replace(/^\//, "");
      const coverKey = `${seriesPath}/${volume.coverImage}`;

      const command = new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: coverKey,
      });

      const response = await r2Client.send(command);
      const bytes = await response.Body.transformToByteArray();
      const contentType = getContentType(volume.coverImage);

      return new Response(bytes, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } else {
      const coverPath = path.join(volume.series.path, volume.coverImage);

      await fs.access(coverPath);
      const file = await fs.readFile(coverPath);
      const contentType = getContentType(coverPath);

      return new Response(file, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch {
    return servePlaceholder();
  }
}

async function servePlaceholder() {
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
