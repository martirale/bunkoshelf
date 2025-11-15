import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import prisma from "@/lib/prisma";
import r2Client, { R2_BUCKET } from "@/lib/r2";

const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";
const SUPPORTED_EXTENSIONS = [".cbz", ".zip"];

export async function DELETE(request, { params }) {
  let _err;
  try {
    const slug =
      (params && params.slug) ||
      (() => {
        const parts = request.nextUrl.pathname.split("/").filter(Boolean);
        return parts[parts.length - 1];
      })();
    if (!slug)
      return NextResponse.json(
        { ok: false, error: "slug missing" },
        { status: 400 }
      );

    const volume = await prisma.mangaVolume.findUnique({ where: { slug } });
    if (!volume)
      return NextResponse.json(
        { ok: false, error: "volume not found" },
        { status: 404 }
      );

    await prisma.mangaVolume.delete({ where: { id: volume.id } });

    if (volume.metadataId) {
      await prisma.volumeMetadata.deleteMany({
        where: { id: volume.metadataId },
      });
    }

    const fullPath = volume.fullPath;
    const ext = path.extname(fullPath).toLowerCase();

    if (LIB_PROVIDER === "cloud") {
      const fileKey = fullPath.replace(/^\/+/, "").replace(/\\/g, "/");
      await r2Client.send(
        new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: fileKey })
      );

      const txtKey = path.posix.join(
        path.posix.dirname(fileKey),
        `${path.parse(fileKey).name}.txt`
      );
      await r2Client.send(
        new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: txtKey })
      );

      const txtPath = `/${txtKey}`;
      await prisma.fileChecksum.deleteMany({ where: { filePath: txtPath } });
    } else {
      await fs.rm(fullPath, { force: true });
      const txtPath = path.join(
        path.dirname(fullPath),
        `${path.parse(fullPath).name}.txt`
      );
      await fs.rm(txtPath, { force: true });
      await prisma.fileChecksum.deleteMany({ where: { filePath: txtPath } });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    _err = error;
  } finally {
    if (_err) {
      console.error("Error deleting volume:", _err);
      return NextResponse.json(
        { ok: false, error: _err.message },
        { status: 500 }
      );
    }
  }
}
