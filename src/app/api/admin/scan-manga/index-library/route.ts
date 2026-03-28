import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";

const LIBRARY_PATH = path.resolve(process.cwd(), "../library/manga");
const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";
const SUPPORTED_EXTENSIONS = [".cbz", ".zip", ".cbr", ".rar"];
const CHECKSUM_STATUS_PATH = path.join(
  process.cwd(),
  "tmp",
  "checksum-status.json"
);

function toSlug(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateChecksum(): string {
  return crypto.randomBytes(8).toString("hex");
}

interface VolumeFile {
  fileName: string;
  fullPath: string;
}

export async function POST(request: NextRequest) {
  let _err: Error | undefined;
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const forceAll = (body as Record<string, unknown>)?.forceAll === true;

    let seriesCount = 0;
    let volumeCount = 0;

    let filesToIndex: string[] = [];

    if (forceAll) {
      const volumes = await prisma.mangaVolume.findMany({
        select: { fullPath: true },
      });
      filesToIndex = volumes.map((v) => v.fullPath);
    } else {
      const checksumData = await fs.readFile(CHECKSUM_STATUS_PATH, "utf-8");
      const parsed = JSON.parse(checksumData) as { filesToIndex?: string[] };
      filesToIndex = parsed.filesToIndex || [];
    }

    if (filesToIndex.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No hay archivos para indexar",
        seriesCount: 0,
        volumeCount: 0,
      });
    }

    if (LIB_PROVIDER === "cloud") {
      const prefix = "library/manga/";
      const seriesMap = new Map<string, VolumeFile[]>();

      for (const fullPath of filesToIndex) {
        const relativePath = fullPath.replace(/^\//, "").replace(prefix, "");
        const parts = relativePath.split("/");

        if (parts.length < 2) continue;

        const seriesName = parts[0];
        const fileName = parts[parts.length - 1];
        const ext = path.extname(fileName).toLowerCase();

        if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

        if (!seriesMap.has(seriesName)) {
          seriesMap.set(seriesName, []);
        }

        seriesMap.get(seriesName)!.push({
          fileName,
          fullPath,
        });
      }

      for (const [seriesName, volumes] of seriesMap) {
        const isOneshot = seriesName.toLowerCase().includes("[oneshot]");
        const cleanTitle = seriesName.replace("[oneshot]", "").trim();
        const slug = toSlug(cleanTitle);

        const mangaSeries = await prisma.mangaSeries.upsert({
          where: { slug },
          update: {
            title: cleanTitle,
            path: `/${prefix}${seriesName}`,
            isOneshot,
            mtime: new Date(),
          },
          create: {
            title: cleanTitle,
            slug,
            path: `/${prefix}${seriesName}`,
            isOneshot,
            mtime: new Date(),
          },
        });

        seriesCount++;

        for (const vol of volumes) {
          const volSlug = toSlug(
            path.basename(vol.fileName, path.extname(vol.fileName))
          );

          await prisma.mangaVolume.upsert({
            where: { slug: volSlug },
            update: {
              title: path.basename(vol.fileName, path.extname(vol.fileName)),
              filename: vol.fileName,
              fullPath: vol.fullPath,
              mtime: new Date(),
              seriesId: mangaSeries.id,
            },
            create: {
              title: path.basename(vol.fileName, path.extname(vol.fileName)),
              slug: volSlug,
              filename: vol.fileName,
              fullPath: vol.fullPath,
              mtime: new Date(),
              seriesId: mangaSeries.id,
            },
          });

          volumeCount++;

          const txtFileName = `${path.parse(vol.fileName).name}.txt`;
          const txtKey = `${prefix}${seriesName}/${txtFileName}`;
          const txtPath = `/${txtKey}`;

          const checksum = generateChecksum();

          const txtCommand = new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: txtKey,
            Body: checksum,
            ContentType: "text/plain",
          });

          await r2Client.send(txtCommand);

          await prisma.fileChecksum.upsert({
            where: { filePath: txtPath },
            update: { checksum },
            create: { filePath: txtPath, checksum },
          });
        }
      }
    } else {
      const seriesMap = new Map<string, { dirName: string; volumes: VolumeFile[] }>();

      for (const fullPath of filesToIndex) {
        const dirPath = path.dirname(fullPath);
        const fileName = path.basename(fullPath);
        const dirName = path.basename(dirPath);

        if (!seriesMap.has(dirPath)) {
          seriesMap.set(dirPath, {
            dirName,
            volumes: [],
          });
        }

        seriesMap.get(dirPath)!.volumes.push({
          fileName,
          fullPath,
        });
      }

      for (const [dirPath, { dirName, volumes }] of seriesMap) {
        const stat = await fs.stat(dirPath);
        const isOneshot = dirName.toLowerCase().includes("[oneshot]");
        const cleanTitle = dirName.replace("[oneshot]", "").trim();
        const slug = toSlug(cleanTitle);

        const mangaSeries = await prisma.mangaSeries.upsert({
          where: { slug },
          update: {
            title: cleanTitle,
            path: dirPath,
            isOneshot,
            mtime: stat.mtime,
          },
          create: {
            title: cleanTitle,
            slug,
            path: dirPath,
            isOneshot,
            mtime: stat.mtime,
          },
        });

        seriesCount++;

        for (const vol of volumes) {
          const volSlug = toSlug(
            path.basename(vol.fileName, path.extname(vol.fileName))
          );
          const volStat = await fs.stat(vol.fullPath);

          await prisma.mangaVolume.upsert({
            where: { slug: volSlug },
            update: {
              title: path.basename(vol.fileName, path.extname(vol.fileName)),
              filename: vol.fileName,
              fullPath: vol.fullPath,
              size: volStat.size,
              mtime: volStat.mtime,
              seriesId: mangaSeries.id,
            },
            create: {
              title: path.basename(vol.fileName, path.extname(vol.fileName)),
              slug: volSlug,
              filename: vol.fileName,
              fullPath: vol.fullPath,
              size: volStat.size,
              mtime: volStat.mtime,
              seriesId: mangaSeries.id,
            },
          });

          volumeCount++;

          const txtFileName = `${path.parse(vol.fileName).name}.txt`;
          const txtPath = path.join(dirPath, txtFileName);
          const checksum = generateChecksum();

          await fs.writeFile(txtPath, checksum, "utf8");

          await prisma.fileChecksum.upsert({
            where: { filePath: txtPath },
            update: { checksum },
            create: { filePath: txtPath, checksum },
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Biblioteca indexada correctamente",
      seriesCount,
      volumeCount,
    });
  } catch (error) {
    _err = error as Error;
  } finally {
    if (_err) {
      console.error("Error al escanear la biblioteca:", _err);
      return NextResponse.json(
        { ok: false, error: _err.message },
        { status: 500 }
      );
    }
  }
}
