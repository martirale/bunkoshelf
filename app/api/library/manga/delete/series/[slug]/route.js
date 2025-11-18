import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import fs from "fs/promises";
import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import prisma from "@/lib/prisma";
import r2Client, { R2_BUCKET } from "@/lib/r2";

const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";

export async function DELETE(request, { params }) {
  let _err;
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const series = await prisma.mangaSeries.findUnique({ where: { slug } });
    if (!series)
      return NextResponse.json(
        { ok: false, error: "series not found" },
        { status: 404 }
      );

    const volumes = await prisma.mangaVolume.findMany({
      where: { seriesId: series.id },
      select: { metadataId: true },
    });

    const metadataIds = volumes.map((v) => v.metadataId).filter(Boolean);

    await prisma.mangaSeries.delete({ where: { id: series.id } });

    if (metadataIds.length > 0) {
      await prisma.volumeMetadata.deleteMany({
        where: { id: { in: metadataIds } },
      });
    }

    const seriesPath = series.path;

    if (LIB_PROVIDER === "cloud") {
      const prefix = seriesPath.replace(/^\/+/, "").replace(/\\/g, "/");
      let continuationToken = undefined;
      do {
        const listRes = await r2Client.send(
          new ListObjectsV2Command({
            Bucket: R2_BUCKET,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          })
        );
        const contents = listRes.Contents || [];
        if (contents.length > 0) {
          const objects = contents.map((c) => ({ Key: c.Key }));
          await r2Client.send(
            new DeleteObjectsCommand({
              Bucket: R2_BUCKET,
              Delete: { Objects: objects },
            })
          );
        }
        continuationToken = listRes.IsTruncated
          ? listRes.NextContinuationToken
          : undefined;
      } while (continuationToken);
      const normalized = `/${prefix}`;
      await prisma.fileChecksum.deleteMany({
        where: { filePath: { startsWith: normalized } },
      });
    } else {
      await fs.rm(seriesPath, { recursive: true, force: true });
      const normalized = seriesPath.startsWith("/")
        ? seriesPath
        : `/${seriesPath.replace(/^\/+/, "")}`;
      await prisma.fileChecksum.deleteMany({
        where: { filePath: { startsWith: normalized } },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    _err = error;
  } finally {
    if (_err) {
      console.error("Error deleting series:", _err);
      return NextResponse.json(
        { ok: false, error: _err.message },
        { status: 500 }
      );
    }
  }
}
