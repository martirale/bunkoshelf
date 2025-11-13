import { NextResponse } from "next/server";
import { mainJob } from "@/lib/jobs/scanManga/mainJob";
import { verifySession } from "@/lib/auth/verifySession";
import { log } from "@/lib/logger";
import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import r2Client, { R2_BUCKET } from "@/lib/r2";

export const runtime = "nodejs";

const LIBRARY_PATH = path.resolve(process.cwd(), "../library/manga");
const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";
const STATUS_PATH = path.join(process.cwd(), "tmp", "checksum-status.json");
const SUPPORTED_EXTENSIONS = [".cbz", ".zip"];

async function checksumVerification() {
  const pathsToIndex = [];

  await fs.mkdir(path.dirname(STATUS_PATH), { recursive: true });

  if (LIB_PROVIDER === "cloud") {
    const prefix = "library/manga/";
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
    });

    const response = await r2Client.send(command);
    const directoriesWithFiles = new Map();

    if (response.Contents) {
      for (const item of response.Contents) {
        const relativePath = item.Key.replace(prefix, "");
        const parts = relativePath.split("/");

        if (parts.length < 2) continue;

        const directoryPath = `/${path.dirname(item.Key)}`;
        const fileName = parts[parts.length - 1];
        const ext = path.extname(fileName).toLowerCase();

        if (!directoriesWithFiles.has(directoryPath)) {
          directoriesWithFiles.set(directoryPath, {
            cbzFiles: [],
            txtFiles: [],
          });
        }

        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          directoriesWithFiles.get(directoryPath).cbzFiles.push(fileName);
        } else if (fileName.endsWith(".txt")) {
          directoriesWithFiles.get(directoryPath).txtFiles.push({
            key: item.Key,
            path: `/${item.Key}`,
            name: fileName,
          });
        }
      }

      for (const [directoryPath, info] of directoriesWithFiles) {
        if (info.cbzFiles.length === 0) continue;

        let needsIndexing = false;

        if (info.txtFiles.length === 0) {
          needsIndexing = true;
        } else {
          const txtMap = new Map();
          for (const txtFile of info.txtFiles) {
            const baseName = path.parse(txtFile.name).name;
            txtMap.set(baseName, txtFile);
          }

          for (const cbzFile of info.cbzFiles) {
            const baseName = path.parse(cbzFile).name;
            const correspondingTxt = txtMap.get(baseName);

            if (!correspondingTxt) {
              needsIndexing = true;
              break;
            }

            const getCommand = new GetObjectCommand({
              Bucket: R2_BUCKET,
              Key: correspondingTxt.key,
            });

            const presignedUrl = await getSignedUrl(r2Client, getCommand, {
              expiresIn: 300,
            });

            const txtResponse = await fetch(presignedUrl);
            if (!txtResponse.ok) {
              needsIndexing = true;
              break;
            }

            const txtContent = await txtResponse.text();
            const checksumFromFile = txtContent.trim();

            const dbRecord = await prisma.fileChecksum.findUnique({
              where: { filePath: correspondingTxt.path },
            });

            if (!dbRecord || dbRecord.checksum !== checksumFromFile) {
              needsIndexing = true;
              break;
            }
          }
        }

        if (needsIndexing && !pathsToIndex.includes(directoryPath)) {
          pathsToIndex.push(directoryPath);
        }
      }
    }
  } else {
    const dirContents = await fs.readdir(LIBRARY_PATH, {
      withFileTypes: true,
    });

    for (const entry of dirContents) {
      if (!entry.isDirectory()) continue;

      const entryPath = path.join(LIBRARY_PATH, entry.name);
      const files = await fs.readdir(entryPath);

      const cbzFiles = files.filter((f) =>
        SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase())
      );

      if (cbzFiles.length === 0) continue;

      const txtFiles = files.filter((f) => f.endsWith(".txt"));

      let needsIndexing = false;

      if (txtFiles.length === 0) {
        needsIndexing = true;
      } else {
        const txtMap = new Map();
        for (const txtFile of txtFiles) {
          const baseName = path.parse(txtFile).name;
          txtMap.set(baseName, txtFile);
        }

        for (const cbzFile of cbzFiles) {
          const baseName = path.parse(cbzFile).name;
          const correspondingTxt = txtMap.get(baseName);

          if (!correspondingTxt) {
            needsIndexing = true;
            break;
          }

          const txtPath = path.join(entryPath, correspondingTxt);
          const txtContent = await fs.readFile(txtPath, "utf-8");
          const checksumFromFile = txtContent.trim();

          const dbRecord = await prisma.fileChecksum.findUnique({
            where: { filePath: txtPath },
          });

          if (!dbRecord || dbRecord.checksum !== checksumFromFile) {
            needsIndexing = true;
            break;
          }
        }
      }

      if (needsIndexing && !pathsToIndex.includes(entryPath)) {
        pathsToIndex.push(entryPath);
      }
    }
  }

  await fs.writeFile(
    STATUS_PATH,
    JSON.stringify(
      { pathsToIndex, timestamp: new Date().toISOString() },
      null,
      2
    ),
    "utf-8"
  );

  return pathsToIndex.length;
}

export async function POST() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let _err;
  try {
    setTimeout(async () => {
      await checksumVerification();
      await mainJob();
    }, 0);

    log({
      event: "Library scan started",
      category: "LIBRARY",
      meta: {
        userId: session.id,
        username: session.username,
        isAdmin: session.isAdmin,
      },
    });

    return NextResponse.json(
      { ok: true, message: "Escaneo iniciado en segundo plano" },
      { status: 202 }
    );
  } catch (error) {
    _err = error;
  } finally {
    if (_err) {
      console.error("Error al iniciar el escaneo:", _err);
      return NextResponse.json(
        { ok: false, error: "Error al iniciar el escaneo" },
        { status: 500 }
      );
    }
  }
}
