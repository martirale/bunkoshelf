import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";

const LIBRARY_PATH = path.resolve(process.cwd(), "../library/manga");
const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";
const SUPPORTED_EXTENSIONS = [".cbz", ".zip"];
const CHECKSUM_STATUS_PATH = path.join(
  process.cwd(),
  "tmp",
  "checksum-status.json"
);

function toSlug(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateChecksum() {
  return crypto.randomBytes(8).toString("hex");
}

export async function POST() {
  let _err;
  try {
    let seriesCount = 0;
    let volumeCount = 0;

    const checksumData = await fs.readFile(CHECKSUM_STATUS_PATH, "utf-8");
    const { pathsToIndex } = JSON.parse(checksumData);

    if (!pathsToIndex || pathsToIndex.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No hay paths para indexar",
        seriesCount: 0,
        volumeCount: 0,
      });
    }

    if (LIB_PROVIDER === "cloud") {
      const prefix = "library/manga/";
      const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: prefix,
      });

      const response = await r2Client.send(command);
      const seriesMap = new Map();

      if (response.Contents) {
        for (const item of response.Contents) {
          const relativePath = item.Key.replace(prefix, "");
          const parts = relativePath.split("/");

          if (parts.length < 2) continue;

          const seriesName = parts[0];
          const itemDirectory = `/${path.dirname(item.Key)}`;

          if (!pathsToIndex.includes(itemDirectory)) continue;

          const fileName = parts[parts.length - 1];
          const ext = path.extname(fileName).toLowerCase();

          if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

          if (!seriesMap.has(seriesName)) {
            seriesMap.set(seriesName, []);
          }

          seriesMap.get(seriesName).push({
            fileName,
            fullPath: `/${item.Key}`,
            size: item.Size,
            mtime: item.LastModified,
          });
        }
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
              size: vol.size,
              mtime: vol.mtime,
              seriesId: mangaSeries.id,
            },
            create: {
              title: path.basename(vol.fileName, path.extname(vol.fileName)),
              slug: volSlug,
              filename: vol.fileName,
              fullPath: vol.fullPath,
              size: vol.size,
              mtime: vol.mtime,
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
      for (const targetPath of pathsToIndex) {
        const stat = await fs.stat(targetPath);
        if (!stat.isDirectory()) continue;

        const files = await fs.readdir(targetPath);
        const volumeFiles = files.filter((f) =>
          SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase())
        );

        if (volumeFiles.length === 0) continue;

        const dirName = path.basename(targetPath);
        const isOneshot = dirName.toLowerCase().includes("[oneshot]");
        const cleanTitle = dirName.replace("[oneshot]", "").trim();
        const slug = toSlug(cleanTitle);

        const mangaSeries = await prisma.mangaSeries.upsert({
          where: { slug },
          update: {
            title: cleanTitle,
            path: targetPath,
            isOneshot,
            mtime: stat.mtime,
          },
          create: {
            title: cleanTitle,
            slug,
            path: targetPath,
            isOneshot,
            mtime: stat.mtime,
          },
        });

        seriesCount++;

        for (const volFile of volumeFiles) {
          const volPath = path.join(targetPath, volFile);
          const volSlug = toSlug(path.basename(volFile, path.extname(volFile)));
          const volStat = await fs.stat(volPath);

          await prisma.mangaVolume.upsert({
            where: { slug: volSlug },
            update: {
              title: path.basename(volFile, path.extname(volFile)),
              filename: volFile,
              fullPath: volPath,
              size: volStat.size,
              mtime: volStat.mtime,
              seriesId: mangaSeries.id,
            },
            create: {
              title: path.basename(volFile, path.extname(volFile)),
              slug: volSlug,
              filename: volFile,
              fullPath: volPath,
              size: volStat.size,
              mtime: volStat.mtime,
              seriesId: mangaSeries.id,
            },
          });

          volumeCount++;

          const txtFileName = `${path.parse(volFile).name}.txt`;
          const txtPath = path.join(targetPath, txtFileName);
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
    _err = error;
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
